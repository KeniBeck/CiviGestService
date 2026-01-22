import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreatePermisoDto } from '../dto/create-permiso.dto';
import { UpdatePermisoDto } from '../dto/update-permiso.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PermisoPaginationService } from 'src/common/services/pagination/permiso/permiso-pagination.service';
import { FilterPermisoDto } from '../dto/filter-permiso.dto';
import { Prisma } from '@prisma/client';
import { PermisoEstatus } from '@prisma/client';

@Injectable()
export class PermisoService {
  constructor(
    private prisma: PrismaService,
    private permisoPaginationService: PermisoPaginationService,
  ) { }

  async create(createPermisoDto: CreatePermisoDto, user: any) {
    const { sedeId, subsedeId, id: userId } = user;
    const tipoPermiso = await this.prisma.tipoPermiso.findFirst({
      where: { id: createPermisoDto.tipoPermisoId, subsedeId, deletedAt: null },
    });
    if (!tipoPermiso) throw new BadRequestException('TipoPermiso no válido para este municipio');
    const año = new Date().getFullYear();
    const nombreTipo = tipoPermiso.nombre.toUpperCase().replace(/\s/g, '');
    const prefix = `${nombreTipo}-${año}-`;
    const ultimoPermiso = await this.prisma.permiso.findFirst({
      where: { subsedeId, folio: { startsWith: prefix } },
      orderBy: { folio: 'desc' },
    });
    let numero = 1;
    if (ultimoPermiso) {
      const partes = ultimoPermiso.folio.split('-');
      numero = parseInt(partes[partes.length - 1]) + 1;
    }
    const folio = `${prefix}${numero.toString().padStart(4, '0')}`;
    const costo = tipoPermiso.costoBase;
    const numUMAs = tipoPermiso.numUMAsBase;
    const numSalarios = tipoPermiso.numSalariosBase;
    const vigenciaDias = createPermisoDto.vigenciaDias || tipoPermiso.vigenciaDefecto;
    const fechaVencimiento = new Date(createPermisoDto.fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias);
    const qr = Buffer.from(folio).toString('base64');
    return this.prisma.permiso.create({
      data: {
        ...createPermisoDto,
        sedeId,
        subsedeId,
        folio,
        costo,
        numUMAs,
        numSalarios,
        vigenciaDias,
        fechaVencimiento,
        qr,
        estatus: PermisoEstatus.SOLICITADO,
        createdBy: userId,
      },
      include: {
        sede: true,
        subsede: true,
        tipoPermiso: true,
      },
    });
  }

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
            qrComprobante:true,
            nombreCiudadano:true,
            documentoCiudadano:true,
            sede:{ select: { id: true, name: true } },
            subsede:{ select: { id: true, name: true } },
            usuarioCobro: { select: { id: true, firstName: true, lastName: true, username: true } },
            usuarioAutorizo: { select: { id: true, firstName: true, lastName: true, username: true } },
          },
        },
      },
    });

    if (!permiso) throw new NotFoundException('Permiso no encontrado o sin acceso');
    return permiso;
  }

  async update(id: number, updatePermisoDto: UpdatePermisoDto, user: any) {
    const permiso = await this.findOne(id, user);
    if (updatePermisoDto.estatus === PermisoEstatus.APROBADO) {
      updatePermisoDto.fechaAprobacion = new Date();
    }
    if (updatePermisoDto.estatus === PermisoEstatus.RECHAZADO) {
      updatePermisoDto.fechaRechazo = new Date();
      if (!updatePermisoDto.motivoRechazo) throw new BadRequestException('motivoRechazo es requerido');
    }
    return this.prisma.permiso.update({
      where: { id },
      data: updatePermisoDto,
      include: { sede: true, subsede: true, tipoPermiso: true },
    });
  }

  async aprobar(id: number, user: any) {
    const permiso = await this.findOne(id, user);
    if (!['SOLICITADO', 'EN_REVISION'].includes(permiso.estatus)) {
      throw new ConflictException('Solo se puede aprobar permisos en estado SOLICITADO o EN_REVISION');
    }
    return this.prisma.permiso.update({
      where: { id },
      data: { estatus: PermisoEstatus.APROBADO, fechaAprobacion: new Date() },
      include: { sede: true, subsede: true, tipoPermiso: true },
    });
  }

  async rechazar(id: number, motivoRechazo: string, user: any) {
    if (!motivoRechazo) throw new BadRequestException('motivoRechazo es requerido');
    const permiso = await this.findOne(id, user);
    return this.prisma.permiso.update({
      where: { id },
      data: { estatus: PermisoEstatus.RECHAZADO, fechaRechazo: new Date(), motivoRechazo },
      include: { sede: true, subsede: true, tipoPermiso: true },
    });
  }

  async remove(id: number, user: any) {
    await this.findOne(id, user);
    return this.prisma.permiso.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
