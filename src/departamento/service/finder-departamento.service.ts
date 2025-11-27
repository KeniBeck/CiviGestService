import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterDepartamentoDto } from '../dto/filter-departamento.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';
import { DepartamentoPaginationService } from '../../common/services/pagination/departamento/departamento-pagination.service';

/**
 * Servicio para búsquedas y consultas de departamentos
 */
@Injectable()
export class FinderDepartamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: DepartamentoPaginationService,
  ) {}

  /**
   * Obtener todos los departamentos con filtros
   */
  async findAll(
    filters: FilterDepartamentoDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles.includes('super_admin');

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

    // Filtro search (busca en nombre y descripción)
    if (filters.search) {
      whereClause.OR = [
        {
          nombre: {
            contains: filters.search,
            mode: 'insensitive' as const,
          },
        },
        {
          descripcion: {
            contains: filters.search,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    return this.prisma.departamento.findMany({
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
            multas: true,
          },
        },
      },
      orderBy: [
        { nombre: 'asc' },
      ],
    });
  }

  /**
   * Obtener departamentos paginados con prefetch
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterDepartamentoDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<PaginatedResponse<any>> {
    return this.paginationService.paginateDepartamentos({
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
   * Obtener un departamento por ID
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles.includes('super_admin');

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

    const departamento = await this.prisma.departamento.findFirst({
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
            multas: true,
          },
        },
      },
    });

    if (!departamento) {
      throw new NotFoundException(`Departamento con ID ${id} no encontrado o sin acceso`);
    }

    return departamento;
  }
}
