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
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FilterRolesDto } from './dto/filter-roles.dto';
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
    return this.roleService.create(createRoleDto, userRoleLevel);
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
    return this.roleFinderService.findAll(filters, userRoleLevel);
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
    return this.roleFinderService.findAvailableRoles(userRoleLevel);
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
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado',
    type: Role,
  })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ): Promise<Role> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.roleFinderService.findOne(id, userRoleLevel);
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
    return this.roleService.update(id, updateRoleDto, userRoleLevel);
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
    return this.roleService.remove(id, userRoleLevel);
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
    return this.roleService.activate(id, userRoleLevel);
  }
}


