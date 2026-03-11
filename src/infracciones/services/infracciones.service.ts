import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreateInfraccionDto } from '../dto/create-infraccion.dto';
import { UpdateInfraccionDto } from '../dto/update-infraccion.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { InfraccionesFinderService } from './infracciones-finder.service';
import { generateQR } from '../../pagos-permisos/utils/qr-generator.util';

@Injectable()
export class InfraccionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finderService: InfraccionesFinderService,
  ) {}

  /**
   * Crear una nueva infracción
   */
  async create(createDto: CreateInfraccionDto, currentUser: any) {
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

    // 2. Generar folio único si no se proporciona
    let folio = createDto.folio;
    if (!folio) {
      const timestamp = Date.now();
      const subsedeCode = multa.subsede.code;
      folio = `INF-${subsedeCode}-${timestamp}`;
    }

    // 3. Validar que el folio sea único
    const folioExiste = await this.prisma.infraccion.findUnique({
      where: { folio },
    });

    if (folioExiste) {
      throw new ConflictException(`Ya existe una infracción con el folio: ${folio}`);
    }

    // 4. Validar agente si se proporciona
    if (createDto.agenteId) {
      const agente = await this.prisma.agente.findUnique({
        where: { id: createDto.agenteId },
      });

      if (!agente) {
        throw new NotFoundException('Agente no encontrado');
      }

      if (!agente.isActive) {
        throw new BadRequestException('El agente no está activo');
      }
    }

    // 5. Copiar costos del catálogo de multas
    const costoBase = multa.costo;
    const numUMAs = multa.numUMAs;
    const numSalarios = multa.numSalarios;

    // 6. Calcular fecha límite de pago si no se proporciona (30 días por defecto)
    let fechaLimitePago = createDto.fechaLimitePago
      ? new Date(createDto.fechaLimitePago)
      : new Date(createDto.fechaInfraccion);
    
    if (!createDto.fechaLimitePago) {
      fechaLimitePago.setDate(fechaLimitePago.getDate() + 30);
    }

    // 7. Crear la infracción primero
    const infraccion = await this.prisma.infraccion.create({
      data: {
        sedeId: multa.sedeId,
        subsedeId: multa.subsedeId,
        multaId: createDto.multaId,
        folio,
        nombreCiudadano: createDto.nombreCiudadano,
        documentoCiudadano: createDto.documentoCiudadano,
        domicilioCiudadano: createDto.domicilioCiudadano,
        telefonoCiudadano: createDto.telefonoCiudadano,
        emailCiudadano: createDto.emailCiudadano,
        descripcion: createDto.descripcion,
        ubicacion: createDto.ubicacion,
        latitud: createDto.latitud,
        longitud: createDto.longitud,
        fechaInfraccion: new Date(createDto.fechaInfraccion),
        agenteId: createDto.agenteId,
        costoBase,
        numUMAs,
        numSalarios,
        estatus: 'LEVANTADA',
        evidencias: createDto.evidencias,
        observaciones: createDto.observaciones,
        fechaLimitePago,
        createdBy: currentUser.sub,
      },
      include: {
        multa: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            descripcion: true,
          },
        },
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
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlaca: true,
          },
        },
      },
    });

    // 8. Generar QR con la URL del frontend para consultar la infracción
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrData = `${frontendUrl}/comprobante-infracciones?dni=${encodeURIComponent(createDto.documentoCiudadano)}&folio=${encodeURIComponent(folio)}`;
    const qrCode = await generateQR(qrData);

    // 9. Actualizar la infracción con el QR generado
    const infraccionConQR = await this.prisma.infraccion.update({
      where: { id: infraccion.id },
      data: { qr: qrCode },
      include: {
        multa: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            descripcion: true,
          },
        },
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
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlaca: true,
          },
        },
      },
    });

    return infraccionConQR;
  }

  /**
   * Actualizar una infracción existente
   */
  async update(
    id: number,
    updateDto: UpdateInfraccionDto,
    currentUser: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar acceso a la infracción
    const infraccion = await this.prisma.infraccion.findUnique({
      where: { id, deletedAt: null },
    });

    if (!infraccion) {
      throw new NotFoundException(`Infracción con ID ${id} no encontrada`);
    }

    await this.validateAccess(
      infraccion,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Validar que no esté pagada (no se puede editar si ya fue pagada)
    if (infraccion.estatus === 'PAGADA') {
      throw new BadRequestException(
        'No se puede modificar una infracción que ya fue pagada',
      );
    }

    // Preparar datos para actualización
    const updateData: any = {
      ...updateDto,
      updatedBy: currentUser.sub,
    };

    // Convertir fechas si existen
    if (updateDto.fechaInfraccion) {
      updateData.fechaInfraccion = new Date(updateDto.fechaInfraccion);
    }

    if (updateDto.fechaLimitePago) {
      updateData.fechaLimitePago = new Date(updateDto.fechaLimitePago);
    }

    // Generar QR si se actualiza el documento del ciudadano
    if (updateDto.documentoCiudadano) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const qrData = `${frontendUrl}/comprobante-infracciones?dni=${encodeURIComponent(updateDto.documentoCiudadano)}&folio=${encodeURIComponent(infraccion.folio)}`;
      const qrCode = await generateQR(qrData);
      updateData.qr = qrCode;
    }

    return this.prisma.infraccion.update({
      where: { id },
      data: updateData,
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
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar (soft delete) una infracción
   */
  async remove(
    id: number,
    currentUser: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar acceso a la infracción
    const infraccion = await this.prisma.infraccion.findUnique({
      where: { id, deletedAt: null },
      include: {
        pagos: { where: { isActive: true } },
      },
    });

    if (!infraccion) {
      throw new NotFoundException(`Infracción con ID ${id} no encontrada`);
    }

    await this.validateAccess(
      infraccion,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Validar que no tenga pagos activos
    if (infraccion.pagos.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar una infracción que tiene pagos registrados',
      );
    }

    return this.prisma.infraccion.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: currentUser.sub,
        isActive: false,
        estatus: 'CANCELADA',
      },
    });
  }

  /**
   * Validar acceso multi-tenant a una infracción
   */
  private async validateAccess(
    infraccion: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<void> {
    const isSuperAdmin = roles?.includes('Super Administrador');

    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        if (infraccion.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a esta infracción',
          );
        }
      } else if (accessLevel === 'SUBSEDE') {
        if (infraccion.subsedeId !== userSubsedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a esta infracción',
          );
        }
      }
    }
  }
}
