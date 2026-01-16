import { Injectable } from '@nestjs/common';
import { PaginationService } from '../pagination.service';
import { PaginatedResponse } from '../../interface/paginate-operation';
import { FilterPermisoDto } from '../../../../permiso/dto/filter-permiso.dto';

@Injectable()
export class PermisoPaginationService {
  constructor(private readonly paginationService: PaginationService) {}

  async paginatePermisos<T>(options: {
    prisma: any;
    page?: number;
    limit?: number;
    filters?: FilterPermisoDto;
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

    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    if (filters?.tipoPermisoId) {
      whereClause.tipoPermisoId = filters.tipoPermisoId;
    }
    if (filters?.estatus) {
      whereClause.estatus = filters.estatus;
    }
    if (filters?.documentoCiudadano) {
      whereClause.documentoCiudadano = filters.documentoCiudadano;
    }
    if (filters?.fechaDesde) {
      whereClause.fechaEmision = { ...whereClause.fechaEmision, gte: filters.fechaDesde };
    }
    if (filters?.fechaHasta) {
      whereClause.fechaEmision = { ...whereClause.fechaEmision, lte: filters.fechaHasta };
    }
    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }
    if (filters?.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      whereClause.OR = [
        { nombreCiudadano: { contains: searchTerm, mode: 'insensitive' as const } },
        { folio: { contains: searchTerm, mode: 'insensitive' as const } },
        { documentoCiudadano: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    return await this.paginationService.paginateEntity<T>({
      prisma,
      entity: 'permiso',
      page,
      limit,
      filters,
      include: {
        sede: true,
        subsede: true,
        tipoPermiso: true,
      },
      where: whereClause,
      orderBy: { fechaSolicitud: 'desc' },
      activatePaginated,
    });
  }
}
