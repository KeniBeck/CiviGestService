import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RolePaginationService } from '../../common/services/pagination/role/role-pagination.service';
import { FilterRolesDto } from '../dto/filter-roles.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';
import { Role } from '../entities/role.entity';
import { RoleLevel } from '@prisma/client';

/**
 * RoleFinderService - Servicio para consultas (GET) de roles
 *
 * Este servicio se encarga de todas las operaciones de lectura,
 * respetando los niveles de permisos:
 * - SUPER_ADMIN: ve todos los roles
 * - ESTATAL: ve roles ESTATAL y MUNICIPAL
 * - MUNICIPAL: ve roles MUNICIPAL y OPERATIVO
 * - OPERATIVO: ve solo roles OPERATIVO
 */
@Injectable()
export class RoleFinderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolePaginationService: RolePaginationService,
  ) {}

  /**
   * Obtener todos los roles con paginación y filtros
   */
  async findAll(
    filters: FilterRolesDto,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<PaginatedResponse<Role>> {
    return this.rolePaginationService.paginateRoles<Role>({
      prisma: this.prisma,
      page: filters.page,
      limit: filters.limit,
      filters,
      activatePaginated: filters.activatePaginated,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    });
  }

  /**
   * Obtener un rol por ID
   * Valida que el usuario tenga permisos para ver ese nivel de rol
   * Y que tenga acceso si es un rol personalizado de sede/subsede
   */
  async findOne(
    id: number,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
    includePermissions: boolean = false,
  ): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: includePermissions
        ? {
            permissions: {
              include: {
                permission: true,
              },
              orderBy: [
                { permission: { resource: 'asc' } },
                { permission: { action: 'asc' } },
              ],
            },
          }
        : undefined,
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    // Validar que el usuario puede ver este nivel de rol
    this.validateRoleLevelAccess(role.level, userRoleLevel);

    // Validar acceso a roles personalizados (no globales)
    this.validateRoleOwnership(role, userSedeId, userSubsedeId);

    return role;
  }

  /**
   * Obtener un rol por nombre
   */
  async findByName(name: string, userRoleLevel: RoleLevel): Promise<Role> {
    const role = await this.prisma.role.findFirst({
      where: { 
        name,
        isGlobal: true,
        sedeId: null,
        subsedeId: null
      },
    });

    if (!role) {
      throw new NotFoundException(`Rol "${name}" no encontrado`);
    }

    // Validar que el usuario puede ver este nivel de rol
    this.validateRoleLevelAccess(role.level, userRoleLevel);

    return role;
  }

  /**
   * Obtener todos los roles disponibles según el nivel del usuario
   * Sin paginación, para selects/dropdowns
   */
  async findAvailableRoles(
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<Role[]> {
    const whereClause: any = { isActive: true };

    // Filtrar roles: globales O de la sede/subsede del usuario
    whereClause.OR = [
      // Roles globales (visibles para todos)
      {
        isGlobal: true,
        sedeId: null,
        subsedeId: null,
      },
      // Roles de la sede del usuario
      {
        isGlobal: false,
        sedeId: userSedeId,
        subsedeId: null,
      },
      // Roles de la subsede del usuario
      ...(userSubsedeId
        ? [
            {
              isGlobal: false,
              sedeId: userSedeId,
              subsedeId: userSubsedeId,
            },
          ]
        : []),
    ];

    // Aplicar restricciones según nivel del usuario
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
    // SUPER_ADMIN no tiene restricción

    return this.prisma.role.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Validar que un usuario puede acceder a un rol según su nivel
   */
  private validateRoleLevelAccess(
    roleLevel: RoleLevel,
    userRoleLevel: RoleLevel,
  ): void {
    // SUPER_ADMIN puede ver todo
    if (userRoleLevel === 'SUPER_ADMIN') {
      return;
    }

    // ESTATAL puede ver ESTATAL y MUNICIPAL
    if (userRoleLevel === 'ESTATAL') {
      if (roleLevel !== 'ESTATAL' && roleLevel !== 'MUNICIPAL') {
        throw new NotFoundException('No tienes permisos para ver este rol');
      }
      return;
    }

    // MUNICIPAL puede ver MUNICIPAL y OPERATIVO
    if (userRoleLevel === 'MUNICIPAL') {
      if (roleLevel !== 'MUNICIPAL' && roleLevel !== 'OPERATIVO') {
        throw new NotFoundException('No tienes permisos para ver este rol');
      }
      return;
    }

    // OPERATIVO solo puede ver OPERATIVO
    if (userRoleLevel === 'OPERATIVO') {
      if (roleLevel !== 'OPERATIVO') {
        throw new NotFoundException('No tienes permisos para ver este rol');
      }
      return;
    }
  }

  /**
   * Validar acceso a roles personalizados (no globales)
   * Los roles globales son visibles para todos
   * Los roles personalizados solo son visibles si:
   * - El rol es de la sede del usuario (sedeId coincide)
   * - O el rol es de la subsede del usuario (sedeId y subsedeId coinciden)
   */
  private validateRoleOwnership(
    role: any,
    userSedeId: number,
    userSubsedeId: number | null,
  ): void {
    // Si es un rol global, todos pueden verlo
    if (role.isGlobal) {
      return;
    }

    // Si es un rol personalizado, validar acceso
    // Caso 1: Rol de sede (sin subsede específica)
    if (role.sedeId && !role.subsedeId) {
      if (role.sedeId !== userSedeId) {
        throw new NotFoundException('No tienes acceso a este rol');
      }
      return;
    }

    // Caso 2: Rol de subsede específica
    if (role.sedeId && role.subsedeId) {
      if (role.sedeId !== userSedeId) {
        throw new NotFoundException('No tienes acceso a este rol');
      }
      
      // Validar subsede solo si el usuario tiene una subsede asignada
      if (userSubsedeId && role.subsedeId !== userSubsedeId) {
        throw new NotFoundException('No tienes acceso a este rol');
      }
      return;
    }
  }

  /**
   * Verificar si un rol con ese nombre ya existe
   */
  async roleNameExists(name: string): Promise<boolean> {
    const role = await this.prisma.role.findFirst({
      where: { 
        name,
        isGlobal: true,
        sedeId: null,
        subsedeId: null
      },
    });
    return !!role;
  }

  /**
   * Contar roles por nivel
   */
  async countByLevel(userRoleLevel: RoleLevel): Promise<{
    total: number;
    byLevel: Record<RoleLevel, number>;
  }> {
    const whereClause: any = {};

    // Aplicar restricciones según nivel del usuario
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

    const total = await this.prisma.role.count({
      where: whereClause,
    });

    const byLevel: Record<RoleLevel, number> = {
      SUPER_ADMIN: 0,
      ESTATAL: 0,
      MUNICIPAL: 0,
      OPERATIVO: 0,
    };

    // Contar por cada nivel permitido
    if (userRoleLevel === 'SUPER_ADMIN') {
      for (const level of Object.keys(byLevel) as RoleLevel[]) {
        byLevel[level] = await this.prisma.role.count({
          where: { level },
        });
      }
    } else if (userRoleLevel === 'ESTATAL') {
      byLevel.ESTATAL = await this.prisma.role.count({
        where: { level: 'ESTATAL' },
      });
      byLevel.MUNICIPAL = await this.prisma.role.count({
        where: { level: 'MUNICIPAL' },
      });
    } else if (userRoleLevel === 'MUNICIPAL') {
      byLevel.MUNICIPAL = await this.prisma.role.count({
        where: { level: 'MUNICIPAL' },
      });
      byLevel.OPERATIVO = await this.prisma.role.count({
        where: { level: 'OPERATIVO' },
      });
    } else if (userRoleLevel === 'OPERATIVO') {
      byLevel.OPERATIVO = await this.prisma.role.count({
        where: { level: 'OPERATIVO' },
      });
    }

    return { total, byLevel };
  }
}
