import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterInfraccionesDto } from '../../../../infracciones/dto/filter-infracciones.dto';

@Injectable()
export class InfraccionesPaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  async paginateInfracciones<T>(options: {
    prisma: any;
    page?: number;
    limit?: number;
    filters?: FilterInfraccionesDto;
    activatePaginated?: boolean;
    userSedeId: number;
    userSubsedeId: number | null;
    accessLevel: string;
    roles: string[];
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
    } = options;

    const isSuperAdmin = roles?.includes('Super Administrador');
    const whereClause: any = { deletedAt: null };

    // Multi-tenancy
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        // Obtener subsedes con acceso
        const userSubsedeAccess = await prisma.userSubsedeAccess.findMany({
          where: { userId: options.userSedeId, isActive: true },
          select: { subsedeId: true },
        });
        
        const subsedeIds = userSubsedeAccess.length > 0
          ? userSubsedeAccess.map((access: any) => access.subsedeId)
          : userSubsedeId ? [userSubsedeId] : [];
        
        if (subsedeIds.length > 0) {
          whereClause.subsedeId = { in: subsedeIds };
        }
      }
    } else {
      // SUPER_ADMIN puede filtrar explícitamente
      if (filters?.sedeId) whereClause.sedeId = filters.sedeId;
      if (filters?.subsedeId) whereClause.subsedeId = filters.subsedeId;
    }

    // Filtros específicos
    if (filters?.multaId) whereClause.multaId = filters.multaId;
    if (filters?.agenteId) whereClause.agenteId = filters.agenteId;
    if (filters?.folio) whereClause.folio = { contains: filters.folio, mode: 'insensitive' as const };
    if (filters?.estatus) whereClause.estatus = filters.estatus;
    if (filters?.isActive !== undefined) whereClause.isActive = filters.isActive;

    // Búsqueda por ciudadano
    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        { nombreCiudadano: { contains: searchTerm, mode: 'insensitive' as const } },
        { documentoCiudadano: { contains: searchTerm, mode: 'insensitive' as const } },
        { folio: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    // Filtro por fechas
    if (filters?.fechaInicio || filters?.fechaFin) {
      whereClause.fechaInfraccion = {};
      if (filters.fechaInicio) {
        whereClause.fechaInfraccion.gte = new Date(filters.fechaInicio);
      }
      if (filters.fechaFin) {
        whereClause.fechaInfraccion.lte = new Date(filters.fechaFin);
      }
    }

    // Filtro por infracciones vencidas
    if (filters?.vencidas) {
      whereClause.estatus = 'LEVANTADA';
      whereClause.fechaLimitePago = { lt: new Date() };
    }

    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'infraccion',
      page,
      limit,
      filters,
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        multa: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            descripcion: true,
          },
        },
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlaca: true,
          },
        },
        pagos: {
          where: { isActive: true },
          select: {
            id: true,
            total: true,
            estatus: true,
            fechaPago: true,
          },
        },
      },
      where: whereClause,
      orderBy: { fechaInfraccion: 'desc' },
      activatePaginated,
    });
  }
}
