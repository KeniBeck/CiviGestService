import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterThemeDto } from '../../../../theme/dto/filter-theme.dto';

/**
 * Servicio de paginación específico para Themes
 */
@Injectable()
export class ThemePaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina los temas con opciones específicas
   */
  async paginateThemes<T>(options: {
    prisma: any;
    page?: number;
    limit?: number;
    filters?: FilterThemeDto;
    activatePaginated?: boolean;
  }): Promise<PaginatedResponse<T>> {
    const {
      prisma,
      page = 1,
      limit = 10,
      filters,
      activatePaginated = true,
    } = options;

    // Construir where clause base
    const whereClause: any = {};

    // Aplicar filtros
    if (filters?.darkMode !== undefined) {
      whereClause.darkMode = filters.darkMode;
    }

    if (filters?.isDefault !== undefined) {
      whereClause.isDefault = filters.isDefault;
    }

    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
        { description: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    // Usar el servicio genérico de paginación
    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'theme',
      page,
      limit,
      filters,
      where: whereClause,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      activatePaginated,
    });
  }
}
