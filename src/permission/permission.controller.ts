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
import { PermissionService } from './service/permission.service';
import { PermissionFinderService } from './service/permission-finder.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { FilterPermissionDto } from './dto/filter-permission.dto';
import { Permission } from './entities/permission.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RoleLevel } from '@prisma/client';

/**
 * PermissionController - Controlador de Permisos del Sistema
 *
 * Los permisos son accesibles para lectura por todos los usuarios autenticados.
 * Solo Super Admins pueden crear, actualizar o eliminar permisos.
 */
@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly permissionFinderService: PermissionFinderService,
  ) {}

  /**
   * Extraer el nivel de rol del usuario desde los roles asignados
   */
  private getUserRoleLevel(user: RequestUser): RoleLevel {
    if (user.roles.includes('Super Administrador')) {
      return 'SUPER_ADMIN';
    }
    if (
      user.roles.some((r) =>
        r.toLowerCase().includes('administrador estatal'),
      )
    ) {
      return 'ESTATAL';
    }
    if (
      user.roles.some((r) =>
        r.toLowerCase().includes('administrador municipal'),
      )
    ) {
      return 'MUNICIPAL';
    }
    return 'OPERATIVO';
  }

  /**
   * Crear un nuevo permiso
   * Solo Super Admin
   */
  @Post()
  @Permissions([{ resource: 'permissions', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear nuevo permiso (Solo Super Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Permiso creado exitosamente',
    type: Permission,
  })
  @ApiResponse({ status: 409, description: 'El permiso ya existe' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<Permission> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionService.create(createPermissionDto, userRoleLevel);
  }

  /**
   * Listar todos los permisos con paginación
   */
  @Get()
  @Permissions([{ resource: 'permissions', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener todos los permisos con paginación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos paginada',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'activatePaginated', required: false, type: Boolean })
  async findAll(
    @Query() filters: FilterPermissionDto,
    @CurrentUser() user: RequestUser,
  ) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionFinderService.findAll(filters, userRoleLevel);
  }

  /**
   * Obtener permisos disponibles (sin paginación)
   */
  @Get('available')
  @Permissions([{ resource: 'permissions', action: 'read' }] as Policy[])
  @ApiOperation({
    summary: 'Obtener permisos disponibles para asignar (sin paginación)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos activos',
    type: [Permission],
  })
  async findAvailable(@CurrentUser() user: RequestUser): Promise<Permission[]> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionFinderService.findAvailable(userRoleLevel);
  }

  /**
   * Obtener permisos agrupados por recurso
   */
  @Get('grouped')
  @Permissions([{ resource: 'permissions', action: 'read' }] as Policy[])
  @ApiOperation({
    summary: 'Obtener permisos agrupados por recurso',
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos agrupados por recurso',
  })
  async findGroupedByResource(@CurrentUser() user: RequestUser) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionFinderService.findGroupedByResource(userRoleLevel);
  }

  /**
   * Obtener estadísticas de permisos
   */
  @Get('stats')
  @Permissions([{ resource: 'permissions', action: 'read' }] as Policy[])
  @ApiOperation({
    summary: 'Obtener estadísticas de permisos',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de permisos',
  })
  async getStats(@CurrentUser() user: RequestUser) {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionFinderService.getStats(userRoleLevel);
  }

  /**
   * Obtener un permiso por ID
   */
  @Get(':id')
  @Permissions([{ resource: 'permissions', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener permiso por ID' })
  @ApiResponse({
    status: 200,
    description: 'Permiso encontrado',
    type: Permission,
  })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ): Promise<Permission> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionFinderService.findOne(id, userRoleLevel);
  }

  /**
   * Actualizar un permiso
   * Solo Super Admin
   */
  @Patch(':id')
  @Permissions([{ resource: 'permissions', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar permiso (Solo Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Permiso actualizado exitosamente',
    type: Permission,
  })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() user: RequestUser,
  ): Promise<Permission> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionService.update(id, updatePermissionDto, userRoleLevel);
  }

  /**
   * Desactivar un permiso
   * Solo Super Admin
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions([{ resource: 'permissions', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Desactivar permiso (Solo Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Permiso desactivado exitosamente',
    type: Permission,
  })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ): Promise<Permission> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionService.remove(id, userRoleLevel);
  }

  /**
   * Reactivar un permiso desactivado
   * Solo Super Admin
   */
  @Patch(':id/activate')
  @Permissions([{ resource: 'permissions', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Reactivar permiso desactivado (Solo Super Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Permiso reactivado exitosamente',
    type: Permission,
  })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ): Promise<Permission> {
    const userRoleLevel = this.getUserRoleLevel(user);
    return this.permissionService.activate(id, userRoleLevel);
  }
}
