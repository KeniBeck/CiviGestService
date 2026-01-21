import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { PaginationService } from '../pagination.service';
import { FilterUsersDto } from '../../../../user/dto/filter-users.dto';

/**
 * Servicio específico para la paginación de usuarios
 */
@Injectable()
export class PaginationUsersService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina los usuarios con opciones específicas
   */
  async paginateUsers<T>(
    options: {
      prisma: any;
      page?: number;
      limit?: number;
      filters?: FilterUsersDto;
      activatePaginated?: boolean;
      userSedeId?: number;
      userSubsedeId?: number | null;
      accessLevel?: string;
      sedeAccessIds?: number[];
      subsedeAccessIds?: number[];
      isSuperAdmin?: boolean;
    }
  ): Promise<PaginatedResponse<T>> {
    try {
      const {
        prisma,
        page = 1,
        limit = 10,
        filters,
        activatePaginated = true,
        userSedeId,
        userSubsedeId,
        accessLevel,
        sedeAccessIds = [],
        subsedeAccessIds = [],
        isSuperAdmin = false,
      } = options;

      // Extraer activatePaginated del filtro si está definido
      const finalActivatePaginated = 
        filters?.activatePaginated !== undefined ? 
        filters.activatePaginated : 
        activatePaginated;

      // Usar el servicio genérico de paginación
      return await this.paginationService.paginateEntity<T>({
        prisma,
        entity: 'user',
        page,
        limit,
        filters: {
          ...filters,
          userSedeId,
          userSubsedeId,
          accessLevel,
          sedeAccessIds,
          subsedeAccessIds,
          isSuperAdmin,
        },
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
          roles: {
            where: { isActive: true },
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                },
              },
            },
          },
          _count: {
            select: {
              sedeAccess: true,
              subsedeAccess: true,
            },
          },
        },
        orderBy: [
          { isActive: 'desc' },
          { lastName: 'asc' },
          { firstName: 'asc' },
        ],
        activatePaginated: finalActivatePaginated,
        buildWhereClause: filters => this.buildUsersWhereClause(filters),
        getAdditionalStats: async () => {
          // Construir where clause para estadísticas SIN el filtro isActive
          // Las estadísticas deben mostrar totales globales
          const statsFilters = {
            ...filters,
            isActive: undefined, // Remover el filtro isActive para las estadísticas
            userSedeId,
            userSubsedeId,
            accessLevel,
            sedeAccessIds,
            subsedeAccessIds,
            isSuperAdmin,
          };

          const statsWhere = this.buildUsersWhereClause(statsFilters);

          // Obtener estadísticas adicionales
          const totalUsers = await prisma.user.count({
            where: statsWhere,
          });
          
          const activeUsers = await prisma.user.count({
            where: { 
              ...statsWhere,
              isActive: true,
            },
          });

          const inactiveUsers = await prisma.user.count({
            where: { 
              ...statsWhere,
              isActive: false,
            },
          });

          return {
            totalUsers,
            activeUsers,
            inactiveUsers,
          };
        },
        transformFn: (user: any) => {
          // No incluir password en la respuesta
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword as T;
        },
      });
    } catch (error) {
      console.error('Error paginating users:', error);
      throw new Error(`Error paginating users: ${error.message}`);
    }
  }

  /**
   * Construye la cláusula where para los usuarios
   * Aplica las mismas restricciones de acceso que FinderUserService
   */
  private buildUsersWhereClause(filters?: any): any {
    const whereClause: any = {};
    
    if (!filters) return whereClause;

    const {
      sedeId,
      subsedeId,
      isActive,
      search,
      userSedeId,
      userSubsedeId,
      accessLevel,
      sedeAccessIds = [],
      subsedeAccessIds = [],
      isSuperAdmin = false,
    } = filters;

    // Filtro por estado activo/inactivo
    // Si se especifica isActive, solo filtramos por ese campo
    // NO incluimos deletedAt porque es solo para auditoría
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    } else {
      // Solo si NO se especifica isActive, excluimos usuarios con deletedAt
      whereClause.deletedAt = null;
    }

    // Filtro de búsqueda por texto
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      
      whereClause.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { username: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Control de acceso según nivel (misma lógica que FinderUserService)
    // SUPER ADMIN: No aplicar restricciones de sede/subsede SALVO que las especifique explícitamente
    if (isSuperAdmin) {
      // Super Admin puede filtrar por sede/subsede específica SI LO SOLICITA
      if (sedeId) {
        whereClause.sedeId = sedeId;
      }
      if (subsedeId) {
        whereClause.subsedeId = subsedeId;
      }
      // Si no especifica sedeId ni subsedeId, NO agregar ningún filtro de sede/subsede
      // Esto permite que vea TODOS los usuarios del sistema
    } else if (accessLevel === 'SEDE') {
      // Usuario SEDE: ve usuarios de su sede y sedes con acceso explícito
      const accessibleSedeIds = [userSedeId, ...sedeAccessIds];
      whereClause.sedeId = { in: accessibleSedeIds };

      // Si filtra por subsede, agregarlo
      if (subsedeId) {
        whereClause.subsedeId = subsedeId;
      }
    } else if (accessLevel === 'SUBSEDE') {
      // Usuario SUBSEDE: solo ve usuarios de su subsede y subsedes con acceso explícito
      const accessibleSubsedeIds = [
        ...(userSubsedeId ? [userSubsedeId] : []),
        ...subsedeAccessIds,
      ];

      if (accessibleSubsedeIds.length > 0) {
        whereClause.subsedeId = { in: accessibleSubsedeIds };
      } else {
        // No tiene acceso a ninguna subsede, forzar resultado vacío
        whereClause.id = -1;
      }
    }

    return whereClause;
  }
}
