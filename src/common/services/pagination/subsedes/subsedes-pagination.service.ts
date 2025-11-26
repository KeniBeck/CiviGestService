import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { PaginationService } from '../pagination.service';
import { FilterSubsedesDto } from '../../../../sudsedes/dto/filter-subsedes.dto';

/**
 * Servicio específico para la paginación de subsedes (municipios)
 */
@Injectable()
export class PaginationSubsedesService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina las subsedes con opciones específicas
   */
  async paginateSubsedes<T>(
    options: {
      prisma: any;
      page?: number;
      limit?: number;
      filters?: FilterSubsedesDto;
      activatePaginated?: boolean;
    }
  ): Promise<PaginatedResponse<T>> {
    try {
      const {
        prisma,
        page = 1,
        limit = 10,
        filters,
        activatePaginated = true,
      } = options;

      // Extraer activatePaginated del filtro si está definido
      const finalActivatePaginated = 
        filters?.activatePaginated !== undefined ? 
        filters.activatePaginated : 
        activatePaginated;

      // Usar el servicio genérico de paginación
      return await this.paginationService.paginateEntity<T>({
        prisma,
        entity: 'subsede',
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
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        activatePaginated: finalActivatePaginated,
        buildWhereClause: filters => this.buildSubsedesWhereClause(filters),
        getAdditionalStats: async () => {
          // Obtener estadísticas adicionales
          const totalSubsedes = await prisma.subsede.count({
            where: { deletedAt: null },
          });
          
          const activeSubsedes = await prisma.subsede.count({
            where: { 
              deletedAt: null,
              isActive: true,
            },
          });

          const inactiveSubsedes = await prisma.subsede.count({
            where: { 
              deletedAt: null,
              isActive: false,
            },
          });

          return {
            totalSubsedes,
            activeSubsedes,
            inactiveSubsedes,
          };
        },
      });
    } catch (error) {
      console.error('Error paginating subsedes:', error);
      throw new Error(`Error paginating subsedes: ${error.message}`);
    }
  }

  /**
   * Construye la cláusula where para las subsedes
   */
  private buildSubsedesWhereClause(filters?: FilterSubsedesDto): any {
    const whereClause: any = {
      deletedAt: null, // Solo subsedes no eliminadas
    };
    
    if (!filters) return whereClause;

    // Filtro por sede (estado)
    if (filters.sedeId) {
      whereClause.sedeId = filters.sedeId;
    }

    // Filtro por estado activo/inactivo
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Filtro de búsqueda por nombre o código
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    return whereClause;
  }
}
