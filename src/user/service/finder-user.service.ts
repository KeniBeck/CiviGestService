import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AccessLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationUsersService } from '../../common/services/pagination/user/user-pagination.service';
import { FilterUsersDto } from '../dto/filter-users.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';

/**
 * FinderUserService - Servicio de búsqueda de usuarios
 * 
 * Control de acceso por nivel de rol:
 * - SUPER_ADMIN: Ve todos los usuarios del sistema
 * - ESTATAL (SEDE): Ve usuarios de su sede y subsedes
 * - MUNICIPAL (SUBSEDE): Ve usuarios de su subsede
 * - OPERATIVO: No puede listar usuarios
 */
@Injectable()
export class FinderUserService {
  constructor(
    private prisma: PrismaService,
    private paginationUsersService: PaginationUsersService,
  ) {}

  /**
   * Listar usuarios según nivel de acceso
   */
  async findAll(
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    userId: number,
    roles: string[],
    sedeAccessIds: number[],
    subsedeAccessIds: number[],
    filters?: {
      sedeId?: number;
      subsedeId?: number;
      isActive?: boolean;
      search?: string; // Buscar por nombre, email o username
    },
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

    // Construir condiciones base
    const whereConditions: any = {
      deletedAt: null,
    };

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      whereConditions.isActive = filters.isActive;
    }

    // Filtro de búsqueda por texto
    if (filters?.search) {
      whereConditions.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Control de acceso según nivel
    if (isSuperAdmin) {
      // Super Admin puede filtrar por sede/subsede específica
      if (filters?.sedeId) {
        whereConditions.sedeId = filters.sedeId;
      }
      if (filters?.subsedeId) {
        whereConditions.subsedeId = filters.subsedeId;
      }
    } else if (accessLevel === AccessLevel.SEDE) {
      // Usuario SEDE: ve usuarios de su sede y sedes con acceso explícito
      const accessibleSedeIds = [userSedeId, ...sedeAccessIds];

      whereConditions.sedeId = { in: accessibleSedeIds };

      // Si filtra por sede, verificar que tenga acceso
      if (filters?.sedeId && !accessibleSedeIds.includes(filters.sedeId)) {
        throw new ForbiddenException('No tienes acceso a usuarios de esa sede');
      }
    } else if (accessLevel === AccessLevel.SUBSEDE) {
      // Usuario SUBSEDE: solo ve usuarios de su subsede y subsedes con acceso explícito
      const accessibleSubsedeIds = [
        ...(userSubsedeId ? [userSubsedeId] : []),
        ...subsedeAccessIds,
      ];

      if (accessibleSubsedeIds.length === 0) {
        return []; // No tiene acceso a ninguna subsede
      }

      whereConditions.subsedeId = { in: accessibleSubsedeIds };

      // Si filtra por subsede, verificar que tenga acceso
      if (filters?.subsedeId && !accessibleSubsedeIds.includes(filters.subsedeId)) {
        throw new ForbiddenException('No tienes acceso a usuarios de esa subsede');
      }
    } else {
      // Otros roles no pueden listar usuarios
      throw new ForbiddenException('No tienes permisos para listar usuarios');
    }

    return this.prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        sedeId: true,
        subsedeId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phoneCountryCode: true,
        phoneNumber: true,
        documentType: true,
        documentNumber: true,
        accessLevel: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        roles: {
          where: { isActive: true },
          select: {
            role: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        },
        _count: {
          select: {
            sedeAccess: true,
            subsedeAccess: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  /**
   * Obtener un usuario por ID
   * Valida que el solicitante tenga acceso
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    userId: number,
    roles: string[],
    sedeAccessIds: number[],
    subsedeAccessIds: number[],
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
        roles: {
          where: { isActive: true },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                level: true,
              },
            },
          },
        },
        sedeAccess: {
          where: { isActive: true },
          include: {
            sede: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        subsedeAccess: {
          where: { isActive: true },
          include: {
            subsede: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const isSuperAdmin = roles.includes('Super Administrador');

    // Validar acceso según nivel
    if (isSuperAdmin) {
      return user; // Super Admin puede ver cualquier usuario
    }

    if (accessLevel === AccessLevel.SEDE) {
      // Usuario SEDE: puede ver usuarios de su sede o sedes con acceso explícito
      const accessibleSedeIds = [userSedeId, ...sedeAccessIds];

      if (!accessibleSedeIds.includes(user.sedeId)) {
        throw new ForbiddenException('No tienes acceso a este usuario');
      }

      return user;
    }

    if (accessLevel === AccessLevel.SUBSEDE) {
      // Usuario SUBSEDE: solo puede ver usuarios de su subsede o subsedes con acceso explícito
      const accessibleSubsedeIds = [
        ...(userSubsedeId ? [userSubsedeId] : []),
        ...subsedeAccessIds,
      ];

      if (!user.subsedeId || !accessibleSubsedeIds.includes(user.subsedeId)) {
        throw new ForbiddenException('No tienes acceso a este usuario');
      }

      return user;
    }

    throw new ForbiddenException('No tienes permisos para ver usuarios');
  }

  /**
   * Listar usuarios por sede
   * Útil para administradores de sede
   */
  async findBySedeId(
    sedeId: number,
    userSedeId: number,
    accessLevel: AccessLevel,
    roles: string[],
    sedeAccessIds: number[],
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

    // Validar acceso a la sede
    if (!isSuperAdmin) {
      const accessibleSedeIds = [userSedeId, ...sedeAccessIds];

      if (!accessibleSedeIds.includes(sedeId)) {
        throw new ForbiddenException('No tienes acceso a usuarios de esa sede');
      }
    }

    return this.prisma.user.findMany({
      where: {
        sedeId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        subsedeId: true,
        accessLevel: true,
        isActive: true,
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        roles: {
          where: { isActive: true },
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
      ],
    });
  }

  /**
   * Listar usuarios por subsede
   * Útil para administradores municipales
   */
  async findBySubsedeId(
    subsedeId: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

    // Validar acceso a la subsede
    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(userSubsedeId ? [userSubsedeId] : []),
          ...subsedeAccessIds,
        ];

        if (!accessibleSubsedeIds.includes(subsedeId)) {
          throw new ForbiddenException('No tienes acceso a usuarios de esa subsede');
        }
      } else if (accessLevel === AccessLevel.SEDE) {
        // Verificar que la subsede pertenezca a una sede accesible
        const subsede = await this.prisma.subsede.findUnique({
          where: { id: subsedeId },
          select: { sedeId: true },
        });

        if (!subsede || subsede.sedeId !== userSedeId) {
          throw new ForbiddenException('No tienes acceso a usuarios de esa subsede');
        }
      }
    }

    return this.prisma.user.findMany({
      where: {
        subsedeId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        accessLevel: true,
        isActive: true,
        roles: {
          where: { isActive: true },
          select: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
      ],
    });
  }

  /**
   * Listar usuarios con paginación y filtros
   * Aplica las mismas restricciones de acceso que findAll
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterUsersDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    userId: number,
    roles: string[],
    sedeAccessIds: number[],
    subsedeAccessIds: number[],
  ): Promise<PaginatedResponse<any>> {
    const isSuperAdmin = roles.includes('Super Administrador');

    // Validar acceso a filtros específicos (misma lógica que findAll)
    if (!isSuperAdmin) {
      if (filters.sedeId) {
        if (accessLevel === AccessLevel.SEDE) {
          const accessibleSedeIds = [userSedeId, ...sedeAccessIds];
          if (!accessibleSedeIds.includes(filters.sedeId)) {
            throw new ForbiddenException('No tienes acceso a usuarios de esa sede');
          }
        } else if (accessLevel === AccessLevel.SUBSEDE) {
          throw new ForbiddenException('No tienes permisos para filtrar por sede');
        }
      }

      if (filters.subsedeId) {
        if (accessLevel === AccessLevel.SUBSEDE) {
          const accessibleSubsedeIds = [
            ...(userSubsedeId ? [userSubsedeId] : []),
            ...subsedeAccessIds,
          ];
          if (!accessibleSubsedeIds.includes(filters.subsedeId)) {
            throw new ForbiddenException('No tienes acceso a usuarios de esa subsede');
          }
        }
      }
    }

    // Llamar al servicio de paginación
    return await this.paginationUsersService.paginateUsers({
      prisma: this.prisma,
      page,
      limit,
      filters,
      activatePaginated,
      userSedeId,
      userSubsedeId,
      accessLevel,
      sedeAccessIds,
      subsedeAccessIds,
      isSuperAdmin,
    });
  }
}
