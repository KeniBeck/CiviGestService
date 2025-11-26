import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterPatrullaDto } from '../dto/filter-patrulla.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';
import { PatrullaPaginationService } from '../../common/services/pagination/patrulla/patrulla-pagination.service';

/**
 * Servicio para búsquedas y consultas de patrullas
 */
@Injectable()
export class FinderPatrullaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PatrullaPaginationService,
  ) {}

  /**
   * Obtener todas las patrullas con filtros (sin paginación)
   */
  async findAll(
    filters: FilterPatrullaDto,
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

    // Filtro por agente
    if (filters.agenteId) {
      whereClause.agenteId = filters.agenteId;
    }

    // Filtro isActive
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Filtro search
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        {
          marca: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          modelo: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          placa: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          numPatrulla: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          serie: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    return this.prisma.patrulla.findMany({
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
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlantilla: true,
            tipo: {
              select: {
                id: true,
                tipo: true,
              },
            },
            departamento: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /**
   * Obtener patrullas paginadas con prefetch
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterPatrullaDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<PaginatedResponse<any>> {
    return this.paginationService.paginatePatrullas({
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
   * Obtener una patrulla por ID
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

    const patrulla = await this.prisma.patrulla.findFirst({
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
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlantilla: true,
            cargo: true,
            tipo: {
              select: {
                id: true,
                tipo: true,
              },
            },
            departamento: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
              },
            },
          },
        },
      },
    });

    if (!patrulla) {
      throw new NotFoundException(
        `Patrulla con ID ${id} no encontrada o sin acceso`,
      );
    }

    return patrulla;
  }
}