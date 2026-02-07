import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreatePagoPermisoDto } from '../dto/create-pago-permiso.dto';
import { UpdatePagoPermisoDto } from '../dto/update-pago-permiso.dto';
import { CreateReembolsoDto } from '../dto/create-reembolso.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PagosPermisosFinderService } from './pagos-permisos-finder.service';
import { generateQR } from '../utils/qr-generator.util';

@Injectable()
export class PagosPermisosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finderService: PagosPermisosFinderService,
  ) {}

  /**
   * Crear un nuevo pago de permiso
   */
  async create(createDto: CreatePagoPermisoDto, currentUser: any) {
    // 1. Validar que el permiso exista y esté APROBADO
    const permiso = await this.prisma.permiso.findUnique({
      where: { id: createDto.permisoId },
      include: {
        sede: true,
        subsede: true,
        tipoPermiso: true,
      },
    });

    if (!permiso) {
      throw new NotFoundException('Permiso no encontrado');
    }

    if (permiso.estatus !== 'APROBADO') {
      throw new BadRequestException('Solo se pueden pagar permisos aprobados');
    }

    // 2. Validar que el permiso NO esté vencido
    if (permiso.fechaVencimiento < new Date()) {
      throw new BadRequestException('El permiso está vencido');
    }

    // 3. Validar que NO exista un pago activo para este permiso
    const pagoExistente = await this.prisma.pagoPermiso.findFirst({
      where: {
        permisoId: createDto.permisoId,
        estatus: 'PAGADO',
        isActive: true,
        deletedAt: null,
      },
    });

    if (pagoExistente) {
      throw new BadRequestException('Este permiso ya tiene un pago registrado');
    }

    // 4. Validar autorización de descuento
    if (createDto.descuentoPct && createDto.descuentoPct > 0) {
      if (!createDto.autorizaDescuento || !createDto.autorizadoPor) {
        throw new BadRequestException(
          'Se requiere autorización para aplicar descuento',
        );
      }

      // Validar que el autorizador tenga permisos
      const autorizador = await this.prisma.user.findUnique({
        where: { id: createDto.autorizadoPor },
        include: { roles: { include: { role: true } } },
      });

      if (!autorizador) {
        throw new NotFoundException('Autorizador no encontrado');
      }

      const tienePermiso = autorizador.roles.some((ur) =>
        [
          'Super Administrador',
          'Administrador Estatal',
          'Administrador Municipal',
        ].includes(ur.role.name),
      );

      if (!tienePermiso) {
        throw new ForbiddenException(
          'El autorizador no tiene permisos para autorizar descuentos',
        );
      }
    }

    // 5. Calcular montos
    const descuentoMonto =
      (createDto.costoBase * (createDto.descuentoPct || 0)) / 100;
    const total = createDto.costoBase - descuentoMonto;

    if (total < 0) {
      throw new BadRequestException('El descuento no puede ser mayor al costo');
    }

    // 6. Generar referencia única de pago
    const timestamp = Date.now();
    const sedeCode = permiso.sede.code;
    const subsedeCode = permiso.subsede.code;
    const metodoPagoCode = createDto.metodoPago.substring(0, 3).toUpperCase(); // EFE, TAR, TRA
    const referenciaPago = `${sedeCode}-${subsedeCode}-${metodoPagoCode}-${timestamp}`;
    // Ejemplo: JAL-GDL-EFE-1737552000000

    // 7. Crear el pago primero para obtener su ID
    const pago = await this.prisma.pagoPermiso.create({
      data: {
        sedeId: permiso.sedeId,
        subsedeId: permiso.subsedeId,
        permisoId: createDto.permisoId,
        nombreCiudadano: permiso.nombreCiudadano,
        documentoCiudadano: permiso.documentoCiudadano,
        costoBase: createDto.costoBase,
        descuentoPct: createDto.descuentoPct || 0,
        descuentoMonto,
        total,
        metodoPago: createDto.metodoPago,
        referenciaPago,
        autorizaDescuento: createDto.autorizaDescuento || false,
        autorizadoPor: createDto.autorizadoPor,
        firmaAutorizacion: createDto.firmaAutorizacion,
        usuarioCobroId: currentUser.sub,
        observaciones: createDto.observaciones,
        estatus: 'PAGADO',
        createdBy: currentUser.sub,
      },
      include: {
        permiso: {
          include: {
            tipoPermiso: true,
          },
        },
        sede: true,
        subsede: true,
        usuarioCobro: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 8. Generar QR con la URL del frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = `${frontendUrl}/comprobante-permisos?dni=${encodeURIComponent(permiso.documentoCiudadano)}&idPago=${pago.id}`;
    const qrCode = await generateQR(qrData);

    // 9. Actualizar el pago con el QR generado
    const pagoConQR = await this.prisma.pagoPermiso.update({
      where: { id: pago.id },
      data: { qrComprobante: qrCode },
      include: {
        permiso: {
          include: {
            tipoPermiso: true,
          },
        },
        sede: true,
        subsede: true,
        usuarioCobro: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return pagoConQR;
  }

  /**
   * Actualizar un pago existente
   */
  async update(
    id: number,
    updateDto: UpdatePagoPermisoDto,
    currentUser: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar acceso al pago
    const pago = await this.prisma.pagoPermiso.findUnique({
      where: { id, deletedAt: null },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    await this.validateAccess(
      pago,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    return this.prisma.pagoPermiso.update({
      where: { id },
      data: {
        ...updateDto,
        updatedBy: currentUser.sub,
      },
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        permiso: {
          select: {
            id: true,
            folio: true,
            tipoPermiso: { select: { id: true, nombre: true } },
          },
        },
      },
    });
  }

  /**
   * Eliminar (soft delete) un pago
   */
  async remove(
    id: number,
    currentUser: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar acceso al pago
    const pago = await this.prisma.pagoPermiso.findUnique({
      where: { id, deletedAt: null },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    await this.validateAccess(
      pago,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    return this.prisma.pagoPermiso.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUser.sub,
        isActive: false,
        estatus: 'CANCELADO',
      },
    });
  }

  /**
   * Crear un reembolso (pago negativo)
   */
  async createReembolso(reembolsoDto: CreateReembolsoDto, currentUser: any) {
    // 1. Validar que el pago original exista y esté pagado
    const pagoOriginal = await this.prisma.pagoPermiso.findUnique({
      where: { id: reembolsoDto.pagoOriginalId },
      include: { permiso: true, sede: true, subsede: true },
    });

    if (!pagoOriginal) {
      throw new NotFoundException('Pago original no encontrado');
    }

    if (pagoOriginal.estatus !== 'PAGADO') {
      throw new BadRequestException(
        'Solo se pueden reembolsar pagos con estatus PAGADO',
      );
    }

    // 2. Validar que no tenga ya un reembolso
    const reembolsoExistente = await this.prisma.pagoPermiso.findFirst({
      where: {
        pagoOriginalId: reembolsoDto.pagoOriginalId,
        esReembolso: true,
        isActive: true,
      },
    });

    if (reembolsoExistente) {
      throw new BadRequestException('Este pago ya tiene un reembolso registrado');
    }

    // 3. Crear pago negativo (reembolso) en transacción
    const reembolso = await this.prisma.$transaction(async (prisma) => {
      // Crear el reembolso con montos negativos
      const nuevoReembolso = await prisma.pagoPermiso.create({
        data: {
          sedeId: pagoOriginal.sedeId,
          subsedeId: pagoOriginal.subsedeId,
          permisoId: pagoOriginal.permisoId,
          nombreCiudadano: pagoOriginal.nombreCiudadano,
          documentoCiudadano: pagoOriginal.documentoCiudadano,
          costoBase: Number(pagoOriginal.costoBase) * -1,
          descuentoPct: 0,
          descuentoMonto: 0,
          total: Number(pagoOriginal.total) * -1,
          metodoPago: pagoOriginal.metodoPago,
          usuarioCobroId: currentUser.sub,
          autorizadoPor: reembolsoDto.autorizadoPor,
          observaciones: `REEMBOLSO DEL PAGO #${pagoOriginal.id}. ${reembolsoDto.motivoReembolso || ''}`,
          estatus: 'REEMBOLSADO',
          esReembolso: true,
          pagoOriginalId: pagoOriginal.id,
          createdBy: currentUser.sub,
        },
      });

      // Actualizar el pago original a REEMBOLSADO
      await prisma.pagoPermiso.update({
        where: { id: pagoOriginal.id },
        data: {
          estatus: 'REEMBOLSADO',
          updatedBy: currentUser.sub,
        },
      });

      // Actulizar el permiso asociado para reflejar que fue reembolsado
      await prisma.permiso.update({
        where: { id: pagoOriginal.permisoId },
        data: {
          estatus: "CANCELADO",
        },
      });
      return nuevoReembolso;
    });

    return reembolso;
  }

  /**
   * Validar acceso multi-tenant a un pago
   */
  private async validateAccess(
    pago: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<void> {
    const isSuperAdmin = roles?.includes('Super Administrador');

    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        if (pago.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a este pago',
          );
        }
      } else if (accessLevel === 'SUBSEDE') {
        if (pago.subsedeId !== userSubsedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a este pago',
          );
        }
      }
    }
  }
}
