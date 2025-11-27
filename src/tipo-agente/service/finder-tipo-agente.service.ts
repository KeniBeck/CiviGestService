import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterTipoAgenteDto } from '../dto/filter-tipo-agente.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';
import { TipoAgentePaginationService } from '../../common/services/pagination/tipo-agente/tipo-agente-pagination.service';

/**
 * Servicio para búsquedas y consultas de tipos de agente
 */
@Injectable()
export class FinderTipoAgenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: TipoAgentePaginationService,
  ) {}

  /**
   * Obtener todos los tipos de agente con filtros
   */
  async findAll(
    filters: FilterTipoAgenteDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

    // Base query
    const whereClause: any = {
      deletedAt: null,
    };

    // Control de acceso multi-tenant
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    // Filtro isActive
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Filtro search (busca en tipo)
    if (filters.search) {
      whereClause.tipo = {
        contains: filters.search,
        mode: 'insensitive' as const,
      };
    }

    return this.prisma.tipoAgente.findMany({
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
        _count: {
          select: {
            agentes: true,
          },
        },
      },
      orderBy: [{ tipo: 'asc' }],
    });
  }

  /**
   * Obtener tipos de agente paginados con prefetch
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterTipoAgenteDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<PaginatedResponse<any>> {
    return this.paginationService.paginateTiposAgente({
      prisma: this.prisma,
      page,
      limit,
      filters,
      activatePaginated,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    });
  }

  /**
   * Obtener un tipo de agente por ID
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

    const whereClause: any = {
      id,
      deletedAt: null,
    };

    // Control de acceso multi-tenant
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    const tipoAgente = await this.prisma.tipoAgente.findFirst({
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
        _count: {
          select: {
            agentes: true,
          },
        },
      },
    });

    if (!tipoAgente) {
      throw new NotFoundException(
        `Tipo de agente con ID ${id} no encontrado o no tiene acceso`,
      );
    }

    return tipoAgente;
  }
}
