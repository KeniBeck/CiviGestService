import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterRolesDto } from '../../../../role/dto/filter-roles.dto';
import { RoleLevel } from '@prisma/client';

@Injectable()
export class RolePaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  async paginateRoles<T>(options: {
    prisma: any;
    page?: number;
    limit?: number;
    filters?: FilterRolesDto;
    activatePaginated?: boolean;
    userRoleLevel: RoleLevel;
  }): Promise<PaginatedResponse<T>> {
    const {
      prisma,
      page = 1,
      limit = 10,
      filters,
      activatePaginated = true,
      userRoleLevel,
    } = options;

    const whereClause: any = {};

    // ============================================
    // LÓGICA DE NIVELES DE PERMISOS
    // ============================================
    // - SUPER_ADMIN: ve todos los roles (sin restricción)
    // - ESTATAL: ve roles ESTATAL y MUNICIPAL
    // - MUNICIPAL: ve roles MUNICIPAL y OPERATIVO
    // - OPERATIVO: ve solo roles OPERATIVO
    // ============================================

    if (userRoleLevel === 'ESTATAL') {
      whereClause.level = {
        in: ['ESTATAL', 'MUNICIPAL'],
      };
    } else if (userRoleLevel === 'MUNICIPAL') {
      whereClause.level = {
        in: ['MUNICIPAL', 'OPERATIVO'],
      };
    } else if (userRoleLevel === 'OPERATIVO') {
      whereClause.level = 'OPERATIVO';
    }
    // SUPER_ADMIN no tiene restricción de nivel

    // Filtro por nivel específico (respetando permisos del usuario)
    if (filters?.level) {
      // Validar que el usuario puede ver ese nivel
      if (userRoleLevel === 'ESTATAL') {
        // Admin Estatal NO puede ver roles SUPER_ADMIN ni OPERATIVO
        if (
          filters.level === 'SUPER_ADMIN' ||
          filters.level === 'OPERATIVO'
        ) {
          // Retornar vacío o ignorar filtro inválido
          whereClause.level = 'ESTATAL'; // Forzar a su nivel
        } else {
          whereClause.level = filters.level;
        }
      } else if (userRoleLevel === 'MUNICIPAL') {
        // Admin Municipal puede ver roles MUNICIPAL y OPERATIVO
        if (
          filters.level !== 'MUNICIPAL' &&
          filters.level !== 'OPERATIVO'
        ) {
          whereClause.level = {
            in: ['MUNICIPAL', 'OPERATIVO'],
          }; // Forzar
        } else {
          whereClause.level = filters.level;
        }
      } else if (userRoleLevel === 'OPERATIVO') {
        // Usuario Operativo SOLO puede ver roles OPERATIVO
        if (filters.level !== 'OPERATIVO') {
          whereClause.level = 'OPERATIVO'; // Forzar
        } else {
          whereClause.level = filters.level;
        }
      } else {
        // SUPER_ADMIN puede filtrar por cualquier nivel
        whereClause.level = filters.level;
      }
    }

    // Filtro por búsqueda (nombre o descripción)
    if (filters?.search) {
      whereClause.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Filtro por estado activo
    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Usar el servicio genérico de paginación
    return this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'role',
      page,
      limit,
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      activatePaginated,
    });
  }
}
