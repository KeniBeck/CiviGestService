import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TipoPermisoPaginationService } from '../../common/services/pagination/tipo-permiso/tipo-permiso-pagination.service';
import { FilterTipoPermisoDto } from '../dto/filter-tipo-permiso.dto';

/**
 * FinderTipoPermisoService - Servicio de consultas paginadas
 */
@Injectable()
export class FinderTipoPermisoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tipoPermisoPaginationService: TipoPermisoPaginationService,
  ) {}

  /**
   * Obtener todos los tipos de permiso con paginación
   * - SUPER_ADMIN: ve todos
   * - ESTATAL (SEDE): ve tipos de permiso de su sede
   * - MUNICIPAL (SUBSEDE): ve tipos de permiso de su subsede
   */
  async findAllPaginated(
    filters: FilterTipoPermisoDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const activatePaginated = filters.activatePaginated !== false;

    return this.tipoPermisoPaginationService.paginateTiposPermiso({
      prisma: this.prisma,
      page,
      limit,
      filters,
      activatePaginated,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    });
  }
}
