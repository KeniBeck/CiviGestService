import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterConfiguracionDto } from '../../../../configuracion/dto/filter-configuracion.dto';

/**
 * Servicio de paginación específico para Configuraciones
 */
@Injectable()
export class ConfiguracionPaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Pagina las configuraciones con opciones específicas
   */
  async paginateConfiguraciones<T>(options: {
    prisma: any;
    page?: number;
    limit?: number;
    filters?: FilterConfiguracionDto;
    activatePaginated?: boolean;
    userSedeId: number;
    userSubsedeId: number | null;
    accessLevel: string;
    roles: string[];
    subsedeAccessIds?: number[];
  }): Promise<PaginatedResponse<T>> {
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
      subsedeAccessIds = [],
    } = options;

    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir where clause base según nivel de acceso
    const whereClause: any = {
      deletedAt: null,
    };

    // Control de acceso multi-tenant
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        // Admin Estatal: ve configuraciones de subsedes de su sede
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        // Admin Municipal: ve solo configuración de su(s) subsede(s)
        const accessibleSubsedeIds = [
          ...(userSubsedeId ? [userSubsedeId] : []),
          ...subsedeAccessIds,
        ];
        whereClause.subsedeId = { in: accessibleSubsedeIds };
      }
    }

    // Aplicar filtros
    if (filters?.themeId) {
      whereClause.themeId = filters.themeId;
    }

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        { nombreCliente: { contains: searchTerm, mode: 'insensitive' as const } },
        { ciudad: { contains: searchTerm, mode: 'insensitive' as const } },
        { titular: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    // Usar el servicio genérico de paginación
    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'configuracion',
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
        theme: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
      where: whereClause,
      orderBy: [{ nombreCliente: 'asc' }],
      activatePaginated,
    });
  }
}
