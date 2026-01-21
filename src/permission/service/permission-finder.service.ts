import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionPaginationService } from '../../common/services/pagination/permission/permission-pagination.service';
import { FilterPermissionDto } from '../dto/filter-permission.dto';
import { PermissionPaginatedResponse } from '../../common/services/interface/permission-paginated-response';
import { Permission } from '../entities/permission.entity';
import { RoleLevel } from '@prisma/client';

/**
 * PermissionFinderService - Servicio para consultas (GET) de permisos
 *
 * Todos los usuarios pueden ver permisos (son públicos dentro del sistema).
 * Los permisos son los bloques básicos del sistema RBAC.
 */
@Injectable()
export class PermissionFinderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionPaginationService: PermissionPaginationService,
  ) {}

  /**
   * Obtener todos los permisos con paginación y filtros
   * Todos los usuarios pueden ver permisos
   */
  async findAll(
    filters: FilterPermissionDto,
    userRoleLevel: RoleLevel,
  ): Promise<PermissionPaginatedResponse<Permission>> {
    return this.permissionPaginationService.paginatePermissions<Permission>({
      prisma: this.prisma,
      page: filters.page,
      limit: filters.limit,
      filters,
      activatePaginated: filters.activatePaginated,
      userRoleLevel,
    });
  }

  /**
   * Obtener un permiso por ID
   * Todos los usuarios pueden ver permisos
   */
  async findOne(id: number, userRoleLevel: RoleLevel): Promise<Permission> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    return permission;
  }

  /**
   * Obtener permisos disponibles (activos) sin paginación
   * Útil para dropdowns/selects
   */
  async findAvailable(userRoleLevel: RoleLevel): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Obtener permisos agrupados por recurso
   * Útil para mostrar en UI organizada
   */
  async findGroupedByResource(
    userRoleLevel: RoleLevel,
  ): Promise<{ resource: string; permissions: Permission[] }[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Agrupar por recurso
    const grouped = permissions.reduce((acc, permission) => {
      const existing = acc.find((g) => g.resource === permission.resource);
      if (existing) {
        existing.permissions.push(permission);
      } else {
        acc.push({
          resource: permission.resource,
          permissions: [permission],
        });
      }
      return acc;
    }, [] as { resource: string; permissions: Permission[] }[]);

    return grouped;
  }

  /**
   * Obtener estadísticas de permisos
   */
  async getStats(userRoleLevel: RoleLevel): Promise<{
    total: number;
    active: number;
    inactive: number;
    byResource: { resource: string; count: number }[];
  }> {
    const [total, active, inactive, byResource] = await Promise.all([
      this.prisma.permission.count(),
      this.prisma.permission.count({ where: { isActive: true } }),
      this.prisma.permission.count({ where: { isActive: false } }),
      this.prisma.permission.groupBy({
        by: ['resource'],
        _count: true,
        orderBy: { resource: 'asc' },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      byResource: byResource.map((item) => ({
        resource: item.resource,
        count: item._count,
      })),
    };
  }
}
