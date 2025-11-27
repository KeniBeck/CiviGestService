import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterConfiguracionDto } from '../dto/filter-configuracion.dto';
import { ConfiguracionPaginationService } from '../../common/services/pagination/configuracion/configuracion-pagination.service';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';
import { AccessLevel } from '@prisma/client';

/**
 * FinderConfiguracionService - Servicio de búsqueda de Configuraciones
 */
@Injectable()
export class FinderConfiguracionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: ConfiguracionPaginationService,
  ) {}

  /**
   * Listar todas las configuraciones sin paginación
   */
  async findAll(
    filters: FilterConfiguracionDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

    // Base query
    const whereClause: any = {
      deletedAt: null,
    };

    // Control de acceso multi-tenant
    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(userSubsedeId ? [userSubsedeId] : []),
          ...subsedeAccessIds,
        ];
        whereClause.subsedeId = { in: accessibleSubsedeIds };
      }
    }

    // Aplicar filtros
    if (filters.themeId) {
      whereClause.themeId = filters.themeId;
    }

    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        {
          nombreCliente: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          ciudad: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          titular: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    return this.prisma.configuracion.findMany({
      where: whereClause,
      include: {
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
        theme: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
      orderBy: {
        nombreCliente: 'asc',
      },
    });
  }

  /**
   * Listar configuraciones paginadas
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterConfiguracionDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
    subsedeAccessIds: number[],
  ): Promise<PaginatedResponse<any>> {
    return this.paginationService.paginateConfiguraciones({
      prisma: this.prisma,
      page,
      limit,
      filters,
      activatePaginated,
      userSedeId,
      userSubsedeId,
      accessLevel: accessLevel.toString(),
      roles,
      subsedeAccessIds,
    });
  }

  /**
   * Obtener una configuración por ID
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

    const configuracion = await this.prisma.configuracion.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        sede: true,
        subsede: true,
        theme: true,
      },
    });

    if (!configuracion) {
      throw new NotFoundException(
        `Configuración con ID ${id} no encontrada`,
      );
    }

    // Validar acceso
    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        if (configuracion.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes acceso a esta configuración',
          );
        }
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(userSubsedeId ? [userSubsedeId] : []),
          ...subsedeAccessIds,
        ];

        if (!accessibleSubsedeIds.includes(configuracion.subsedeId)) {
          throw new ForbiddenException(
            'No tienes acceso a esta configuración',
          );
        }
      }
    }

    return configuracion;
  }

  /**
   * Obtener configuración por subsedeId
   * Útil para obtener la configuración del municipio actual del usuario
   */
  async findBySubsede(
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
          throw new ForbiddenException(
            'No tienes acceso a esta subsede',
          );
        }
      } else if (accessLevel === AccessLevel.SEDE) {
        // Verificar que la subsede pertenezca a su sede
        const subsede = await this.prisma.subsede.findFirst({
          where: {
            id: subsedeId,
            sedeId: userSedeId,
            deletedAt: null,
          },
        });

        if (!subsede) {
          throw new ForbiddenException(
            'No tienes acceso a esta subsede',
          );
        }
      }
    }

    const configuracion = await this.prisma.configuracion.findFirst({
      where: {
        subsedeId,
        deletedAt: null,
      },
      include: {
        sede: true,
        subsede: true,
        theme: true,
      },
    });

    if (!configuracion) {
      throw new NotFoundException(
        `Configuración para subsede ${subsedeId} no encontrada`,
      );
    }

    return configuracion;
  }
}
