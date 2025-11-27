import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationSubsedesService } from '../../common/services/pagination/subsedes/subsedes-pagination.service';
import { FilterSubsedesDto } from '../dto/filter-subsedes.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';

/**
 * FinderSubsedesService - Servicio de búsqueda de Subsedes
 * Maneja la lógica de permisos para listar y obtener subsedes
 */
@Injectable()
export class FinderSubsedesService {
  constructor(
    private prisma: PrismaService,
    private paginationSubsedesService: PaginationSubsedesService,
  ) {}

  /**
   * Listar subsedes según nivel de acceso
   * - SUPER_ADMIN: Ve todas las subsedes del sistema
   * - SEDE: Ve todas las subsedes de su sede
   * - SUBSEDE: Ve solo su propia subsede y aquellas con acceso explícito
   */
  async findAll(
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    userId: number,
    roles?: string[],
    subsedeAccessIds?: number[],
    sedeId?: number, // Filtro opcional por sede
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Super Admin puede ver todas las subsedes
    if (isSuperAdmin) {
      return this.prisma.subsede.findMany({
        where: {
          deletedAt: null,
          ...(sedeId && { sedeId }), // Filtrar por sede si se especifica
        },
        include: {
          sede: true,
          configuracion: {
            select: {
              nombreCliente: true,
              logo: true,
              titular: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    // Usuario con acceso SEDE: ve todas las subsedes de su sede
    if (accessLevel === AccessLevel.SEDE) {
      return this.prisma.subsede.findMany({
        where: {
          sedeId: userSedeId,
          deletedAt: null,
        },
        include: {
          sede: true,
          configuracion: {
            select: {
              nombreCliente: true,
              logo: true,
              titular: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    // Usuario con acceso SUBSEDE: ve su propia subsede y aquellas con acceso explícito
    if (accessLevel === AccessLevel.SUBSEDE) {
      const accessibleSubsedeIds = [
        ...(userSubsedeId ? [userSubsedeId] : []), // Su propia subsede
        ...(subsedeAccessIds || []), // Accesos explícitos del token
      ];

      if (accessibleSubsedeIds.length === 0) {
        return [];
      }

      return this.prisma.subsede.findMany({
        where: {
          id: { in: accessibleSubsedeIds },
          deletedAt: null,
        },
        include: {
          sede: true,
          configuracion: {
            select: {
              nombreCliente: true,
              logo: true,
              titular: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    return [];
  }

  /**
   * Obtener una subsede por ID
   * Valida que el usuario tenga acceso a esa subsede
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    userId: number,
    roles?: string[],
    subsedeAccessIds?: number[],
  ) {
    const subsede = await this.prisma.subsede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        sede: true,
        configuracion: {
          include: {
            theme: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!subsede) {
      throw new NotFoundException(`Subsede con ID ${id} no encontrada`);
    }

    const isSuperAdmin = roles?.includes('Super Administrador');

    // Super Admin puede ver cualquier subsede
    if (isSuperAdmin) {
      return subsede;
    }

    // Validar acceso según nivel
    if (accessLevel === AccessLevel.SEDE) {
      // Puede ver subsedes de su propia sede
      if (subsede.sedeId !== userSedeId) {
        throw new ForbiddenException('No tienes acceso a esta subsede');
      }

      return subsede;
    }

    if (accessLevel === AccessLevel.SUBSEDE) {
      // Puede ver su propia subsede o aquellas con acceso explícito
      const hasAccess =
        id === userSubsedeId ||
        (subsedeAccessIds && subsedeAccessIds.includes(id));

      if (!hasAccess) {
        throw new ForbiddenException('No tienes acceso a esta subsede');
      }

      return subsede;
    }

    throw new ForbiddenException('Acceso denegado');
  }

  /**
   * Listar subsedes por sede
   * Útil para obtener todas las subsedes de una sede específica
   */
  async findBySedeId(
    sedeId: number,
    userSedeId: number,
    accessLevel: AccessLevel,
    roles?: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Super Admin puede ver subsedes de cualquier sede
    if (!isSuperAdmin) {
      // Usuario SEDE solo puede ver subsedes de su propia sede
      if (accessLevel === AccessLevel.SEDE && sedeId !== userSedeId) {
        throw new ForbiddenException(
          'No tienes acceso a las subsedes de esta sede',
        );
      }

      // Usuario SUBSEDE no puede listar subsedes de otras sedes
      if (accessLevel === AccessLevel.SUBSEDE && sedeId !== userSedeId) {
        throw new ForbiddenException(
          'No tienes acceso a las subsedes de esta sede',
        );
      }
    }

    return this.prisma.subsede.findMany({
      where: {
        sedeId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Listar subsedes con paginación y filtros
   * Aplica permisos según el nivel de acceso del usuario
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterSubsedesDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    userId: number,
    roles?: string[],
    subsedeAccessIds?: number[],
  ): Promise<PaginatedResponse<any>> {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir filtros base según nivel de acceso
    const baseFilters: FilterSubsedesDto = { ...filters };

    // Usuario con acceso SEDE: solo ve subsedes de su sede
    if (accessLevel === AccessLevel.SEDE && !isSuperAdmin) {
      baseFilters.sedeId = userSedeId;
    }

    // Usuario con acceso SUBSEDE: solo ve sus subsedes accesibles
    if (accessLevel === AccessLevel.SUBSEDE && !isSuperAdmin) {
      baseFilters.sedeId = userSedeId;
      
      // Aquí aplicaremos un filtro adicional después de obtener los resultados
      // ya que Prisma no soporta directamente "id IN" con paginación
    }

    // Llamar al servicio de paginación
    const result = await this.paginationSubsedesService.paginateSubsedes({
      prisma: this.prisma,
      page,
      limit,
      filters: baseFilters,
      activatePaginated,
    });

    // Si es usuario SUBSEDE, filtrar solo las subsedes accesibles
    if (accessLevel === AccessLevel.SUBSEDE && !isSuperAdmin) {
      const accessibleSubsedeIds = [
        ...(userSubsedeId ? [userSubsedeId] : []),
        ...(subsedeAccessIds || []),
      ];

      if (accessibleSubsedeIds.length === 0) {
        return {
          ...result,
          items: [],
          pagination: {
            ...result.pagination,
            totalItems: 0,
            totalPages: 0,
          },
        };
      }

      // Filtrar items de la página actual
      const filteredItems = result.items.filter((item: any) =>
        accessibleSubsedeIds.includes(item.id),
      );

      // Filtrar nextPages
      const filteredNextPages = result.nextPages.map(page => ({
        ...page,
        items: page.items.filter((item: any) =>
          accessibleSubsedeIds.includes(item.id),
        ),
      }));

      return {
        ...result,
        items: filteredItems,
        nextPages: filteredNextPages,
      };
    }

    return result;
  }
}
