import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterPatrullaDto } from '../../../../patrulla/dto/filter-patrulla.dto';

/**
 * Servicio de paginación específico para Patrullas
 */
@Injectable()
export class PatrullaPaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina las patrullas con opciones específicas
   */
  async paginatePatrullas<T>(
    options: {
      prisma: any;
      page?: number;
      limit?: number;
      filters?: FilterPatrullaDto;
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

    if (filters?.agenteId) {
      whereClause.agenteId = filters.agenteId;
    }

    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        { marca: { contains: searchTerm, mode: 'insensitive' as const } },
        { modelo: { contains: searchTerm, mode: 'insensitive' as const } },
        { placa: { contains: searchTerm, mode: 'insensitive' as const } },
        { numPatrulla: { contains: searchTerm, mode: 'insensitive' as const } },
        { serie: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    // Usar el servicio genérico de paginación
    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'patrulla',
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
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
      activatePaginated,
    });
  }
}
