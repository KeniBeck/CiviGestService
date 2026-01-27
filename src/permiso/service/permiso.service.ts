import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreatePermisoDto } from '../dto/create-permiso.dto';
import { UpdatePermisoDto } from '../dto/update-permiso.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PermisoEstatus } from '@prisma/client';
import { generateQR } from 'src/pagos-permisos/utils/qr-generator.util';
import { FinderPermisoService } from './finder-permiso.service';

@Injectable()
export class PermisoService {
  constructor(
    private prisma: PrismaService,
    private finderPermisoService: FinderPermisoService,
  ) {}

  async create(createPermisoDto: CreatePermisoDto, user: any) {
    const { sedeId, subsedeId, id: userId } = user;
    const tipoPermiso = await this.prisma.tipoPermiso.findFirst({
      where: { id: createPermisoDto.tipoPermisoId, subsedeId, deletedAt: null },
    });
    if (!tipoPermiso)
      throw new BadRequestException(
        'TipoPermiso no válido para este municipio',
      );
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
    const vigenciaDias =
      createPermisoDto.vigenciaDias || tipoPermiso.vigenciaDefecto;
    const fechaVencimiento = new Date(createPermisoDto.fechaEmision);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + vigenciaDias);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = `${frontendUrl}/comprobante-permisos?dni=${encodeURIComponent(createPermisoDto.documentoCiudadano)}`;
    const qrCode = await generateQR(qrData);

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
        qr: qrCode,
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

  async update(id: number, updatePermisoDto: UpdatePermisoDto, user: any) {
    const permiso = await this.finderPermisoService.findOne(id, user);
    if (updatePermisoDto.estatus === PermisoEstatus.APROBADO) {
      updatePermisoDto.fechaAprobacion = new Date();
    }
    if (updatePermisoDto.estatus === PermisoEstatus.RECHAZADO) {
      updatePermisoDto.fechaRechazo = new Date();
      if (!updatePermisoDto.motivoRechazo)
        throw new BadRequestException('motivoRechazo es requerido');
    }
    if (updatePermisoDto.documentoCiudadano) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const qrData = `${frontendUrl}/comprobante-permisos?dni=${encodeURIComponent(updatePermisoDto.documentoCiudadano)}`;
      const qrCode = await generateQR(qrData);
      updatePermisoDto.qr = qrCode;
    }
    return this.prisma.permiso.update({
      where: { id },
      data: updatePermisoDto,
      include: { sede: true, subsede: true, tipoPermiso: true },
    });
  }

  async aprobar(id: number, user: any) {
    const permiso = await this.finderPermisoService.findOne(id, user);
    if (!['SOLICITADO', 'EN_REVISION'].includes(permiso.estatus)) {
      throw new ConflictException(
        'Solo se puede aprobar permisos en estado SOLICITADO o EN_REVISION',
      );
    }
    return this.prisma.permiso.update({
      where: { id },
      data: { estatus: PermisoEstatus.APROBADO, fechaAprobacion: new Date() },
      include: { sede: true, subsede: true, tipoPermiso: true },
    });
  }

  async rechazar(id: number, motivoRechazo: string, user: any) {
    if (!motivoRechazo)
      throw new BadRequestException('motivoRechazo es requerido');
    const permiso = await this.finderPermisoService.findOne(id, user);
    return this.prisma.permiso.update({
      where: { id },
      data: {
        estatus: PermisoEstatus.RECHAZADO,
        fechaRechazo: new Date(),
        motivoRechazo,
      },
      include: { sede: true, subsede: true, tipoPermiso: true },
    });
  }

  async remove(id: number, user: any) {
    await this.finderPermisoService.findOne(id, user);
    return this.prisma.permiso.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
