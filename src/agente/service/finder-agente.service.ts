import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterAgenteDto } from '../dto/filter-agente.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';
import { AgentePaginationService } from '../../common/services/pagination/agente/agente-pagination.service';

/**
 * Servicio para búsquedas y consultas de agentes con paginación
 */
@Injectable()
export class FinderAgenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: AgentePaginationService,
  ) {}

  /**
   * Obtener todos los agentes con filtros (sin paginación o con paginación manual)
   */
  async findAll(
    filters: FilterAgenteDto,
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

    // Filtro por tipo de agente
    if (filters.tipoId) {
      whereClause.tipoId = filters.tipoId;
    }

    // Filtro por departamento
    if (filters.departamentoId) {
      whereClause.departamentoId = filters.departamentoId;
    }

    // Filtro por patrulla
    if (filters.patrullaId) {
      whereClause.patrullaId = filters.patrullaId;
    }

    // Filtro isActive
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Filtro search (busca en nombres, apellidos, numPlaca, correo)
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        {
          nombres: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          apellidoPaterno: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          apellidoMaterno: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          numPlaca: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          correo: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    return this.prisma.agente.findMany({
      where: whereClause,
      include: {
        sede: {
          select: {
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            name: true,
            code: true,
          },
        },
        tipo: {
          select: {
            tipo: true,
          },
        },
        departamento: {
          select: {
            nombre: true,
            descripcion: true,
          },
        },
        patrulla: {
          select: {
            numPatrulla: true,
          },
        },
      },
      orderBy: [
        { apellidoPaterno: 'asc' },
        { apellidoMaterno: 'asc' },
        { nombres: 'asc' },
      ],
    });
  }

  /**
   * Obtener agentes paginados con prefetch
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterAgenteDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<PaginatedResponse<any>> {
    return this.paginationService.paginateAgentes({
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
   * Obtener un agente por ID
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

    const agente = await this.prisma.agente.findFirst({
      where: whereClause,
      include: {
        sede: {
          select: {
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            name: true,
            code: true,
          },
        },
        tipo: {
          select: {
            tipo: true,
          },
        },
        departamento: {
          select: {
            nombre: true,
            descripcion: true,
          },
        },
        patrulla: {
          select: {
            numPatrulla: true,
          },
        },
      },
    });

    if (!agente) {
      throw new NotFoundException(
        `Agente con ID ${id} no encontrado o sin acceso`,
      );
    }

    return agente;
  }
}
