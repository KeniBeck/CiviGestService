import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterTipoAgenteDto } from '../../../../tipo-agente/dto/filter-tipo-agente.dto';

/**
 * Servicio de paginación específico para TipoAgente
 */
@Injectable()
export class TipoAgentePaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina los tipos de agente con opciones específicas
   */
  async paginateTiposAgente<T>(
    options: {
      prisma: any;
      page?: number;
      limit?: number;
      filters?: FilterTipoAgenteDto;
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

    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.tipo = {
        contains: searchTerm,
        mode: 'insensitive' as const,
      };
    }

    // Usar el servicio genérico de paginación
    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'tipoAgente',
      page,
      limit,
      filters,
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
      where: whereClause,
      orderBy: [{ tipo: 'asc' }],
      activatePaginated,
    });
  }
}
