import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { PaginationService } from '../pagination.service';
import { FilterSedesDto } from '../../../../sedes/dto/filter-sedes.dto';

/**
 * Servicio específico para la paginación de sedes (estados)
 */
@Injectable()
export class PaginationSedesService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina las sedes con opciones específicas
   */
  async paginateSedes<T>(
    options: {
      prisma: any;
      page?: number;
      limit?: number;
      filters?: FilterSedesDto;
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
        entity: 'sede',
        page,
        limit,
        filters,
        include: {
          _count: {
            select: {
              subsedes: true,
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        activatePaginated: finalActivatePaginated,
        buildWhereClause: filters => this.buildSedesWhereClause(filters),
        getAdditionalStats: async () => {
          // Obtener estadísticas adicionales
          const totalSedes = await prisma.sede.count({
            where: { deletedAt: null },
          });
          
          const activeSedes = await prisma.sede.count({
            where: { 
              deletedAt: null,
              isActive: true,
            },
          });

          const inactiveSedes = await prisma.sede.count({
            where: { 
              deletedAt: null,
              isActive: false,
            },
          });

          return {
            totalSedes,
            activeSedes,
            inactiveSedes,
          };
        },
      });
    } catch (error) {
      console.error('Error paginating sedes:', error);
      throw new Error(`Error paginating sedes: ${error.message}`);
    }
  }

  /**
   * Construye la cláusula where para las sedes
   */
  private buildSedesWhereClause(filters?: FilterSedesDto): any {
    const whereClause: any = {
      deletedAt: null, // Solo sedes no eliminadas
    };
    
    if (!filters) return whereClause;

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
