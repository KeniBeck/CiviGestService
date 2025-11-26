import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterAgenteDto } from '../../../../agente/dto/filter-agente.dto';

/**
 * Servicio de paginación específico para Agentes
 */
@Injectable()
export class AgentePaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina los agentes con opciones específicas
   */
  async paginateAgentes<T>(
    options: {
      prisma: any;
      page?: number;
      limit?: number;
      filters?: FilterAgenteDto;
      activatePaginated?: boolean;
      userSedeId: number;
      userSubsedeId: number | null;
      accessLevel: string;
      roles: string[];
    }
  ): Promise<PaginatedResponse<T>> {
    const {
      prisma,
      page = 1,
      limit = 10,
      filters,
      activatePaginated = true,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    } = options;

    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir where clause base según nivel de acceso
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

    // Aplicar filtros
    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters?.tipoId) {
      whereClause.tipoId = filters.tipoId;
    }

    if (filters?.departamentoId) {
      whereClause.departamentoId = filters.departamentoId;
    }

    if (filters?.patrullaId) {
      whereClause.patrullaId = filters.patrullaId;
    }

    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' as const } },
        { apellido: { contains: searchTerm, mode: 'insensitive' as const } },
        { numPlantilla: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    // Usar el servicio genérico de paginación
    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'agente',
      page,
      limit,
      filters,
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
          },
        },
        patrulla: {
          select: {
            numPatrulla: true,
          },
        },
      },
      where: whereClause,
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      activatePaginated,
    });
  }
}
