import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterThemeDto } from '../dto/filter-theme.dto';
import { ThemePaginationService } from '../../common/services/pagination/theme/theme-pagination.service';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';

/**
 * FinderThemesService - Servicio de búsqueda de temas
 * Endpoints públicos o para cualquier usuario autenticado
 */
@Injectable()
export class FinderThemesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: ThemePaginationService,
  ) {}

  /**
   * Listar todos los temas sin paginación
   */
  async findAll(filters: FilterThemeDto) {
    // Construir where clause
    const whereClause: any = {};

    if (filters.darkMode !== undefined) {
      whereClause.darkMode = filters.darkMode;
    }

    if (filters.isDefault !== undefined) {
      whereClause.isDefault = filters.isDefault;
    }

    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    return this.prisma.theme.findMany({
      where: whereClause,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Listar temas paginados
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterThemeDto,
    activatePaginated: boolean,
  ): Promise<PaginatedResponse<any>> {
    return this.paginationService.paginateThemes({
      prisma: this.prisma,
      page,
      limit,
      filters,
      activatePaginated,
    });
  }

  /**
   * Obtener un tema por ID
   */
  async findOne(id: number) {
    const theme = await this.prisma.theme.findUnique({
      where: { id },
      include: {
        configuraciones: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            nombreCliente: true,
          },
        },
      },
    });

    if (!theme) {
      throw new NotFoundException(`Tema con ID ${id} no encontrado`);
    }

    return theme;
  }

  /**
   * Obtener el tema por defecto
   * Si no hay default, retorna el primer tema
   */
  async findDefault() {
    // Buscar tema por defecto
    let theme = await this.prisma.theme.findFirst({
      where: {
        isDefault: true,
      },
    });

    // Si no hay default, retornar el primer tema
    if (!theme) {
      theme = await this.prisma.theme.findFirst({
        orderBy: {
          id: 'asc',
        },
      });
    }

    if (!theme) {
      throw new NotFoundException(
        'No hay temas disponibles en el sistema',
      );
    }

    return theme;
  }
}
