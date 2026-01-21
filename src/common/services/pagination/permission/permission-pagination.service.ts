import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PermissionPaginatedResponse } from '../../interface/permission-paginated-response';
import { FilterPermissionDto } from '../../../../permission/dto/filter-permission.dto';
import { RoleLevel } from '@prisma/client';

@Injectable()
export class PermissionPaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  async paginatePermissions<T>(options: {
    prisma: any;
    page?: number;
    limit?: number;
    filters?: FilterPermissionDto;
    activatePaginated?: boolean;
    userRoleLevel: RoleLevel;
  }): Promise<PermissionPaginatedResponse<T>> {
    const {
      prisma,
      page = 1,
      limit = 10,
      filters,
      activatePaginated = true,
      userRoleLevel,
    } = options;

    const whereClause: any = {};

    // Filtro por recurso
    if (filters?.resource) {
      whereClause.resource = {
        contains: filters.resource,
        mode: 'insensitive' as const,
      };
    }

    // Filtro por acción
    if (filters?.action) {
      whereClause.action = {
        contains: filters.action,
        mode: 'insensitive' as const,
      };
    }

    // Filtro por estado activo
    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Búsqueda general
    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        {
          resource: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          action: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    // Obtener estadísticas adicionales
    const [paginatedResult, activeCount, inactiveCount, resourcesCount] = await Promise.all([
      // Resultado paginado
      this.paginationService.paginateEntity<T>({
        prisma,
        entity: 'permission',
        page,
        limit,
        where: whereClause,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        activatePaginated,
      }),
      // Total de permisos activos
      prisma.permission.count({
        where: { ...whereClause, isActive: true },
      }),
      // Total de permisos inactivos
      prisma.permission.count({
        where: { ...whereClause, isActive: false },
      }),
      // Total de recursos únicos
      prisma.permission.findMany({
        where: whereClause,
        select: { resource: true },
        distinct: ['resource'],
      }),
    ]);

    // Agregar estadísticas a la respuesta
    return {
      ...paginatedResult,
      stats: {
        totalActive: activeCount,
        totalInactive: inactiveCount,
        totalResources: resourcesCount.length,
        resources: resourcesCount.map(r => r.resource).sort(),
      },
    };
  }
}
