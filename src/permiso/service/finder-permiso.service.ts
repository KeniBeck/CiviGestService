import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterPermisoDto } from '../dto/filter-permiso.dto';
import { FindDniPermisoDto } from '../dto/find-dni-permiso.dto';
import { PermisoPaginationService } from 'src/common/services/pagination/permiso/permiso-pagination.service';

@Injectable()
export class FinderPermisoService {
  constructor(
    private prisma: PrismaService,
    private permisoPaginationService: PermisoPaginationService,
  ) {}
  async findAll(filters: FilterPermisoDto, user: any) {
    const { sedeId, subsedeId, accessLevel, roles } = user;
    return this.permisoPaginationService.paginatePermisos({
      prisma: this.prisma,
      page: filters.page,
      limit: filters.limit,
      filters,
      userSedeId: sedeId,
      userSubsedeId: subsedeId,
      accessLevel,
      roles,
    });
  }

  async findDNI(findDniDto: FindDniPermisoDto) {
    return this.permisoPaginationService.paginatePermisosByDni({
      prisma: this.prisma,
      page: findDniDto.page,
      limit: findDniDto.limit,
      documentoCiudadano: findDniDto.documentoCiudadano,
      pagoId: findDniDto.pagoId,
    });
  }

  async findOne(id: number, user: any) {
    const { sedeId, subsedeId, accessLevel, roles } = user;
    const isSuperAdmin = roles?.includes('Super Administrador');
    const whereClause: any = { id, deletedAt: null };
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') whereClause.sedeId = sedeId;
      else if (accessLevel === 'SUBSEDE') whereClause.subsedeId = subsedeId;
    }
    const permiso = await this.prisma.permiso.findFirst({
      where: whereClause,
      include: {
        sede: true,
        subsede: true,
        tipoPermiso: { include: { sede: true, subsede: true } },
        pagos: {
          select: {
            id: true,
            metodoPago: true,
            total: true,
            fechaPago: true,
            estatus: true,
            referenciaPago: true,
            observaciones: true,
            costoBase: true,
            descuentoPct: true,
            descuentoMonto: true,
            qrComprobante: true,
            nombreCiudadano: true,
            documentoCiudadano: true,
            sede: { select: { id: true, name: true } },
            subsede: { select: { id: true, name: true, configuracion: { select: { logo: true } } } },
            usuarioCobro: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
            usuarioAutorizo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!permiso)
      throw new NotFoundException('Permiso no encontrado o sin acceso');
    return permiso;
  }
}
