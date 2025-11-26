import { Injectable } from '@nestjs/common';
import { PageData, PaginatedResponse } from '../interface/paginate-operation';

@Injectable()
export class PaginationService {
  /**
   * Procesa los resultados de una consulta y los organiza en formato paginado con prefetch
   * @param items Elementos a paginar
   * @param page Número de página actual
   * @param limit Límite de elementos por página
   * @param totalItems Total de elementos en la base de datos
   * @returns Resultados paginados con prefetch de páginas adicionales
   */
  processPaginatedResults<T>(
    items: T[],
    page: number,
    limit: number,
    totalItems: number,
    additionalStats?: Record<string, any>
  ): PaginatedResponse<T> {
    const pageNumber = Math.max(1, page);
    const itemsPerPage = Math.min(50, Math.max(1, limit));
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Si no hay elementos
    if (items.length === 0) {
      return {
        pagination: {
          totalItems: 0,
          itemsPerPage,
          currentPage: pageNumber,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          ...additionalStats
        },
        items: [],
        nextPages: [],
      };
    }
    
    // Separar los elementos entre la página actual y las siguientes
    const currentPageItems = items.slice(0, itemsPerPage);
    
    // Organizar las páginas adicionales
    const nextPagesItems: PageData<T>[] = [];
    
    for (let i = 0; i < Math.min(2, totalPages - pageNumber); i++) {
      const startIndex = (i + 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageItems = items.slice(startIndex, endIndex);
      
      if (pageItems.length > 0) {
        nextPagesItems.push({
          pageNumber: pageNumber + i + 1,
          items: pageItems,
        });
      }
    }
    
    return {
      pagination: {
        totalItems,
        itemsPerPage,
        currentPage: pageNumber,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
        ...additionalStats
      },
      items: currentPageItems,
      nextPages: nextPagesItems,
    };
  }
  
  /**
   * Método genérico para paginar cualquier entidad
   * @param options Opciones para la paginación
   * @returns Resultados paginados
   */
  async paginateEntity<T, F = any>(
    options: {
      prisma: any;
      entity: string;
      page?: number;
      limit?: number;
      where?: any;
      filters?: F;
      include?: any;
      orderBy?: any;
      activatePaginated?: boolean;
      transformFn?: (item: any) => T;
      buildWhereClause?: (filters: F) => any;
      getAdditionalStats?: () => Promise<Record<string, any>>;
    }
  ): Promise<PaginatedResponse<T>> {
    try {
      const {
        prisma,
        entity,
        page = 1,
        limit = 10,
        where = {},
        filters,
        include = {},
        orderBy = { id: 'desc' },
        activatePaginated = true,
        transformFn = (item: any) => item as T,
        buildWhereClause,
        getAdditionalStats,
      } = options;
  
      // Construir cláusula where
      let whereClause = where;
      if (filters && buildWhereClause) {
        whereClause = buildWhereClause(filters);
      }
  
      // Configuración base
      const queryConfig: any = {
        where: whereClause,
        include,
        orderBy,
      };
  
      // Obtener conteos en paralelo
      let totalItems = 0;
      let additionalStats = {};
  
      try {
        totalItems = await prisma[entity].count({ where: whereClause });
        
        if (getAdditionalStats) {
          additionalStats = await getAdditionalStats();
        }
      } catch (countError) {
        console.error(`Error counting ${entity}:`, countError);
      }
  
      // Caso sin paginación
      if (activatePaginated === false) {
        const allItems = await prisma[entity].findMany(queryConfig);
        const transformedItems = allItems.map(transformFn);
  
        return {
          items: transformedItems,
          pagination: {
            totalItems,
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            itemsPerPage: totalItems,
            ...additionalStats
          },
          nextPages: [],
        };
      }
  
      // Aplicar paginación
      const pageNumber = Math.max(1, page);
      const itemsPerPage = Math.min(50, Math.max(1, limit));
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      
      // CAMBIO CLAVE: Calcular el número total de elementos que necesitamos obtener
      // para la página actual y el prefetch (máximo 3 páginas en total)
      const pagesToFetch = Math.min(3, totalPages - pageNumber + 1);
      const totalItemsToFetch = pagesToFetch * itemsPerPage;
      
      // Calcular el índice de inicio para la consulta
      const skip = (pageNumber - 1) * itemsPerPage;
  
      // Configurar la consulta para obtener elementos para la página actual y las siguientes
      const prefetchQueryConfig = {
        ...queryConfig,
        skip,
        take: totalItemsToFetch,
      };
  
      // Ejecutar consulta con prefetch
      const fetchedItems = await prisma[entity].findMany(prefetchQueryConfig);
      const transformedItems = fetchedItems.map(transformFn);
  
      // Manejar caso sin resultados
      if (transformedItems.length === 0) {
        return {
          items: [],
          pagination: {
            totalItems: 0,
            currentPage: pageNumber,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            itemsPerPage,
            ...additionalStats
          },
          nextPages: [],
        };
      }
  
      // Procesar con el método existente para dividir en páginas
      return this.processPaginatedResults(
        transformedItems,
        pageNumber,
        itemsPerPage,
        totalItems,
        additionalStats
      );
    } catch (error) {
      console.error('Error in paginateEntity:', error);
      throw new Error(`Error paginating entity: ${error.message}`);
    }
  }
}