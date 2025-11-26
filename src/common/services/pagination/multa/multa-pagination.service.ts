import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterMultaDto } from '../../../../multa/dto/filter-multa.dto';

/**
 * Servicio de paginación específico para Multas
 */
@Injectable()
export class MultaPaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina las multas con opciones específicas
   */
  async paginateMultas<T>(
    options: {
      prisma: any;
      page?: number;
      limit?: number;
      filters?: FilterMultaDto;
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
    if (filters?.departamentoId) {
      whereClause.departamentoId = filters.departamentoId;
    }

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' as const } },
        { codigo: { contains: searchTerm, mode: 'insensitive' as const } },
        { descripcion: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    // Usar el servicio genérico de paginación
    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'multa',
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
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
      where: whereClause,
      orderBy: [
        { departamentoId: 'asc' },
        { codigo: 'asc' },
      ],
      activatePaginated,
    });
  }
}
