import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessLevel } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { PaginationSedesService } from '../../common/services/pagination/sedes/sedes-pagination.service';
import { FilterSedesDto } from '../dto/filter-sedes.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';

@Injectable()
export class FinderSedesService {

    constructor(
        private prisma: PrismaService,
        private paginationSedesService: PaginationSedesService,
    ) { }

  /**
    * Listar todas las sedes
    * - SUPER_ADMIN: Ve todas las sedes
    * - SEDE: Solo ve su propia sede y aquellas a las que tiene acceso explícito
    * - SUBSEDE: Ve la sede a la que pertenece su subsede
    */
  async findAll(
    sedeId: number,
    accessLevel: AccessLevel,
    userId: number,
    roles: string[],
    sedeAccessIds: number[],
  ) {
    // Si es Super Administrador, puede ver TODAS las sedes
    if (roles?.includes('Super Administrador')) {
      return this.prisma.sede.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              subsedes: true,
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    // Si el usuario tiene acceso SEDE, puede ver su sede y las que tenga acceso explícito
    if (accessLevel === AccessLevel.SEDE) {
      // Combinar sede propia con accesos explícitos del token
      const accessibleSedeIds = [
        sedeId, // Su propia sede
        ...sedeAccessIds, // Accesos explícitos ya cargados en el token
      ];

      return this.prisma.sede.findMany({
        where: {
          id: { in: accessibleSedeIds },
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              subsedes: true,
              users: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    // Si tiene acceso SUBSEDE, solo ve su sede
    if (accessLevel === AccessLevel.SUBSEDE) {
      return this.prisma.sede.findMany({
        where: {
          id: sedeId,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              subsedes: true,
              users: true,
            },
          },
        },
      });
    }

    return [];
  }

    /**
     * Obtener una sede por ID
     * Valida que el usuario tenga acceso a esa sede
     */
    async findOne(
        id: number,
        userSedeId: number,
        accessLevel: AccessLevel,
        userId: number,
        roles: string[],
    ) {
        const sede = await this.prisma.sede.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                subsedes: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        isActive: true,
                    },
                    orderBy: {
                        name: 'asc',
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        if (!sede) {
            throw new NotFoundException(`Sede con ID ${id} no encontrada`);
        }

        // Si es Super Administrador, puede ver cualquier sede
        if (roles?.includes('Super Administrador')) {
            return sede;
        }

        // Validar acceso según nivel
        if (accessLevel === AccessLevel.SEDE) {
            // Puede ver su propia sede o sedes con acceso explícito
            if (id !== userSedeId) {
                const hasAccess = await this.prisma.userSedeAccess.findFirst({
                    where: {
                        userId,
                        sedeId: id,
                        isActive: true,
                    },
                });

                if (!hasAccess) {
                    throw new ForbiddenException('No tienes acceso a esta sede');
                }
            }

            return sede;
        }

        if (accessLevel === AccessLevel.SUBSEDE) {
            // Solo puede ver su propia sede
            if (id !== userSedeId) {
                throw new ForbiddenException('No tienes acceso a esta sede');
            }

            return sede;
        }

        throw new ForbiddenException('Acceso denegado');
    }

  /**
   * Listar sedes con paginación y filtros
   * Aplica permisos según el nivel de acceso del usuario
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterSedesDto,
    activatePaginated: boolean,
    userSedeId: number,
    accessLevel: AccessLevel,
    userId: number,
    roles?: string[],
    sedeAccessIds?: number[],
  ): Promise<PaginatedResponse<any>> {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir filtros base según nivel de acceso
    const baseFilters: FilterSedesDto = { ...filters };

    // Llamar al servicio de paginación
    const result = await this.paginationSedesService.paginateSedes({
      prisma: this.prisma,
      page,
      limit,
      filters: baseFilters,
      activatePaginated,
    });

    // Si NO es Super Admin, filtrar sedes accesibles
    if (!isSuperAdmin) {
      // Usuario con acceso SEDE: solo ve su sede y las que tenga acceso explícito
      if (accessLevel === AccessLevel.SEDE) {
        const accessibleSedeIds = [
          userSedeId, // Su propia sede
          ...(sedeAccessIds || []), // Accesos explícitos
        ];

        // Filtrar items de la página actual
        const filteredItems = result.items.filter((item: any) =>
          accessibleSedeIds.includes(item.id),
        );

        // Filtrar nextPages
        const filteredNextPages = result.nextPages.map(page => ({
          ...page,
          items: page.items.filter((item: any) =>
            accessibleSedeIds.includes(item.id),
          ),
        }));

        return {
          ...result,
          items: filteredItems,
          nextPages: filteredNextPages,
        };
      }

      // Usuario con acceso SUBSEDE: solo ve su propia sede
      if (accessLevel === AccessLevel.SUBSEDE) {
        // Filtrar items de la página actual
        const filteredItems = result.items.filter((item: any) =>
          item.id === userSedeId,
        );

        // Filtrar nextPages
        const filteredNextPages = result.nextPages.map(page => ({
          ...page,
          items: page.items.filter((item: any) =>
            item.id === userSedeId,
          ),
        }));

        return {
          ...result,
          items: filteredItems,
          nextPages: filteredNextPages,
        };
      }
    }

    return result;
  }

}