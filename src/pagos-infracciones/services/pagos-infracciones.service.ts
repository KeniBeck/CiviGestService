import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreatePagoInfraccionDto } from '../dto/create-pago-infraccion.dto';
import { UpdatePagoInfraccionDto } from '../dto/update-pago-infraccion.dto';
import { CreateReembolsoInfraccionDto } from '../dto/create-reembolso-infraccion.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PagosInfraccionesFinderService } from './pagos-infracciones-finder.service';
import { generateQR } from '../../pagos-permisos/utils/qr-generator.util';

@Injectable()
export class PagosInfraccionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finderService: PagosInfraccionesFinderService,
  ) {}

  /**
   * Crear un nuevo pago de infracción
   */
  async create(createDto: CreatePagoInfraccionDto, currentUser: any) {
    // 1. Validar que la multa (catálogo) exista
    const multa = await this.prisma.multa.findUnique({
      where: { id: createDto.multaId },
      include: {
        sede: true,
        subsede: true,
      },
    });

    if (!multa) {
      throw new NotFoundException('Multa no encontrada en el catálogo');
    }

    if (!multa.isActive) {
      throw new BadRequestException('La multa no está activa');
    }

    // 2. Validar que NO exista un pago activo para este folio de infracción
    const pagoExistente = await this.prisma.pagoInfraccion.findFirst({
      where: {
        folioInfraccion: createDto.folioInfraccion,
        estatus: 'PAGADO',
        isActive: true,
        deletedAt: null,
      },
    });

    if (pagoExistente) {
      throw new BadRequestException('Este folio de infracción ya tiene un pago registrado');
    }

    // 3. Validar autorización de descuento
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

    // 4. Calcular montos
    const descuentoMonto =
      (createDto.costoBase * (createDto.descuentoPct || 0)) / 100;
    const total = createDto.costoBase - descuentoMonto;

    if (total < 0) {
      throw new BadRequestException('El descuento no puede ser mayor al costo');
    }

    // 5. Generar referencia única de pago
    const timestamp = Date.now();
    const sedeCode = multa.sede.code;
    const subsedeCode = multa.subsede.code;
    const metodoPagoCode = createDto.metodoPago.substring(0, 3).toUpperCase();
    const referenciaPago = createDto.referenciaPago || 
      `${sedeCode}-${subsedeCode}-INF-${metodoPagoCode}-${timestamp}`;

    // 6. Crear el pago primero para obtener su ID
    const pago = await this.prisma.pagoInfraccion.create({
      data: {
        sedeId: multa.sedeId,
        subsedeId: multa.subsedeId,
        multaId: createDto.multaId,
        folioInfraccion: createDto.folioInfraccion,
        nombreCiudadano: createDto.nombreCiudadano,
        documentoCiudadano: createDto.documentoCiudadano,
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
        multa: {
          include: {
            departamento: true,
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

    // 7. Generar QR con la URL del frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = `${frontendUrl}/comprobante-infracciones?dni=${encodeURIComponent(createDto.documentoCiudadano)}&idPago=${pago.id}`;
    const qrCode = await generateQR(qrData);

    // 8. Actualizar el pago con el QR generado
    const pagoConQR = await this.prisma.pagoInfraccion.update({
      where: { id: pago.id },
      data: { qrComprobante: qrCode },
      include: {
        multa: {
          include: {
            departamento: true,
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
    updateDto: UpdatePagoInfraccionDto,
    currentUser: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar acceso al pago
    const pago = await this.prisma.pagoInfraccion.findUnique({
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

    return this.prisma.pagoInfraccion.update({
      where: { id },
      data: {
        ...updateDto,
        updatedBy: currentUser.sub,
      },
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        multa: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
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
    const pago = await this.prisma.pagoInfraccion.findUnique({
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

    return this.prisma.pagoInfraccion.update({
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
  async createReembolso(reembolsoDto: CreateReembolsoInfraccionDto, currentUser: any) {
    // 1. Validar que el pago original exista y esté pagado
    const pagoOriginal = await this.prisma.pagoInfraccion.findUnique({
      where: { id: reembolsoDto.pagoOriginalId },
      include: { multa: true, sede: true, subsede: true },
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
    const reembolsoExistente = await this.prisma.pagoInfraccion.findFirst({
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
      const nuevoReembolso = await prisma.pagoInfraccion.create({
        data: {
          sedeId: pagoOriginal.sedeId,
          subsedeId: pagoOriginal.subsedeId,
          multaId: pagoOriginal.multaId,
          folioInfraccion: pagoOriginal.folioInfraccion,
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
      await prisma.pagoInfraccion.update({
        where: { id: pagoOriginal.id },
        data: {
          estatus: 'REEMBOLSADO',
          updatedBy: currentUser.sub,
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
