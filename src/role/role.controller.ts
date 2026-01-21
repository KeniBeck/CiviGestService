import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RoleService } from './service/role.service';
import { RoleFinderService } from './service/role-finder.service';
import { RolePermissionService } from './service/role-permission.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FilterRolesDto } from './dto/filter-roles.dto';
import {
  AssignPermissionDto,
  AssignMultiplePermissionsDto,
  SyncPermissionsDto,
} from './dto/assign-permission.dto';
import { Role } from './entities/role.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RoleLevel } from '@prisma/client';

/**
 * RoleController - Controlador de Roles
 *
 * Gestiona los endpoints para administración de roles con niveles de permisos:
 * - SUPER_ADMIN: acceso completo a todos los roles
 * - ESTATAL: gestiona roles ESTATAL y MUNICIPAL
 * - MUNICIPAL: gestiona roles MUNICIPAL y OPERATIVO
 * - OPERATIVO: solo lectura de roles OPERATIVO
 */
@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly roleFinderService: RoleFinderService,
    private readonly rolePermissionService: RolePermissionService,
  ) {}

  /**
   * Obtener el nivel de rol más alto del usuario
   */
  private getUserRoleLevel(user: RequestUser): RoleLevel {
    const roles = user.roles || [];

    // Jerarquía de roles (mayor a menor)
    if (roles.includes('Super Administrador')) return RoleLevel.SUPER_ADMIN;
    if (roles.includes('Administrador Estatal')) return RoleLevel.ESTATAL;
    if (roles.includes('Administrador Municipal')) return RoleLevel.MUNICIPAL;
    return RoleLevel.OPERATIVO;
  }

  /**
   * Crear nuevo rol
   */
  @Post()
  @Permissions([{ resource: 'roles', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear nuevo rol' })
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente',
    type: Role,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 409, description: 'El nombre del rol ya existe' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: RequestUser,
  ): Promise<Role> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleService.create(
      createRoleDto,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  /**
   * Obtener todos los roles con paginación y filtros
   */
  @Get()
  @Permissions([{ resource: 'roles', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener todos los roles con paginación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles paginada',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'level', required: false, enum: RoleLevel })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'activatePaginated', required: false, type: Boolean })
  async findAll(
    @Query() filters: FilterRolesDto,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleFinderService.findAll(
      filters,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  /**
   * Obtener roles disponibles (sin paginación)
   * Útil para selects/dropdowns
   */
  @Get('available')
  @Permissions([{ resource: 'roles', action: 'read' }] as Policy[])
  @ApiOperation({
    summary: 'Obtener roles disponibles para asignar (sin paginación)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles disponibles',
    type: [Role],
  })
  async findAvailable(@CurrentUser() user: RequestUser): Promise<Role[]> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleFinderService.findAvailableRoles(
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  /**
   * Obtener estadísticas de roles por nivel
   */
  @Get('stats/by-level')
  @Permissions([{ resource: 'roles', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener estadísticas de roles por nivel' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de roles',
  })
  async getStatsByLevel(@CurrentUser() user: RequestUser) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleFinderService.countByLevel(userRoleLevel);
  }

  /**
   * Obtener un rol por ID
   */
  @Get(':id')
  @Permissions([{ resource: 'roles', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiQuery({
    name: 'includePermissions',
    required: false,
    type: Boolean,
    description: 'Incluir permisos del rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includePermissions') includePermissions: boolean = false,
    @CurrentUser() user: RequestUser,
  ): Promise<Role> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleFinderService.findOne(
      id,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
      includePermissions,
    );
  }

  /**
   * Actualizar un rol
   */
  @Patch(':id')
  @Permissions([{ resource: 'roles', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 409, description: 'El nombre del rol ya existe' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: RequestUser,
  ): Promise<Role> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleService.update(
      id,
      updateRoleDto,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  /**
   * Desactivar un rol
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions([{ resource: 'roles', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Desactivar rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol desactivado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({
    status: 400,
    description: 'El rol está asignado a usuarios',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleService.remove(
      id,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  /**
   * Reactivar un rol desactivado
   */
  @Patch(':id/activate')
  @Permissions([{ resource: 'roles', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Reactivar rol desactivado' })
  @ApiResponse({
    status: 200,
    description: 'Rol reactivado exitosamente',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ): Promise<Role> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleService.activate(
      id,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  // ============================================
  // ENDPOINTS DE GESTIÓN DE PERMISOS
  // ============================================

  /**
   * Obtener todos los permisos de un rol
   */
  @Get(':id/permissions')
  @Permissions([{ resource: 'roles', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener permisos de un rol' })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos del rol',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async getRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.rolePermissionService.getRolePermissions(
      id,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  /**
   * Asignar un permiso a un rol
   */
  @Post(':id/permissions')
  @Permissions([{ resource: 'roles', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Asignar un permiso a un rol' })
  @ApiResponse({
    status: 201,
    description: 'Permiso asignado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol o permiso no encontrado' })
  @ApiResponse({ status: 400, description: 'Permiso ya asignado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async assignPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionDto: AssignPermissionDto,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.rolePermissionService.assignPermissionToRole(
      id,
      assignPermissionDto.permissionId,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  /**
   * Asignar múltiples permisos a un rol
   */
  @Post(':id/permissions/bulk')
  @Permissions([{ resource: 'roles', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Asignar múltiples permisos a un rol' })
  @ApiResponse({
    status: 201,
    description: 'Permisos asignados exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async assignMultiplePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignMultipleDto: AssignMultiplePermissionsDto,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.rolePermissionService.assignMultiplePermissionsToRole(
      id,
      assignMultipleDto.permissionIds,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  /**
   * Sincronizar permisos de un rol (reemplaza todos)
   */
  @Put(':id/permissions/sync')
  @Permissions([{ resource: 'roles', action: 'update' }] as Policy[])
  @ApiOperation({
    summary: 'Sincronizar permisos de un rol (reemplaza todos los permisos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos sincronizados exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async syncPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() syncPermissionsDto: SyncPermissionsDto,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.rolePermissionService.syncRolePermissions(
      id,
      syncPermissionsDto.permissionIds,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  /**
   * Remover un permiso de un rol
   */
  @Delete(':id/permissions/:permissionId')
  @Permissions([{ resource: 'roles', action: 'update' }] as Policy[])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover un permiso de un rol' })
  @ApiResponse({
    status: 204,
    description: 'Permiso removido exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol o permiso no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.rolePermissionService.removePermissionFromRole(
      id,
      permissionId,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }

  /**
   * Remover múltiples permisos de un rol
   */
  @Delete(':id/permissions/bulk')
  @Permissions([{ resource: 'roles', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Remover múltiples permisos de un rol' })
  @ApiResponse({
    status: 200,
    description: 'Permisos removidos exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async removeMultiplePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() removeMultipleDto: AssignMultiplePermissionsDto,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.rolePermissionService.removeMultiplePermissionsFromRole(
      id,
      removeMultipleDto.permissionIds,
      userRoleLevel,
      user.sedeId,
      user.subsedeId,
    );
  }
}


