import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AccessLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMultaDto } from '../dto/create-multa.dto';
import { UpdateMultaDto } from '../dto/update-multa.dto';

/**
 * MultaService - Servicio de gestión de multas
 * 
 * IMPORTANTE: Multi-tenancy estricto
 * - sedeId y subsedeId se toman del usuario autenticado
 * - Usuarios solo operan en su subsede (municipio)
 * - Código único por subsede (municipio)
 */
@Injectable()
export class MultaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear nueva multa
   * - sedeId y subsedeId se toman del usuario autenticado
   * - Valida código único dentro de la subsede
   * - Valida que al menos uno de costo/numUMAs/numSalarios existe
   * - Valida que el departamentoId existe y pertenece a la subsede del usuario
   */
  async create(
    createMultaDto: CreateMultaDto,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ) {
    // Validar que el usuario tiene subsedeId
    if (!userSubsedeId) {
      throw new BadRequestException(
        'El usuario debe tener una subsede asignada para crear multas',
      );
    }

    // Validar que al menos uno de los montos existe
    if (!createMultaDto.costo && !createMultaDto.numUMAs && !createMultaDto.numSalarios) {
      throw new BadRequestException(
        'Debe especificar al menos uno de: costo, numUMAs o numSalarios',
      );
    }

    // Validar que el departamento existe y pertenece a la subsede del usuario
    const departamento = await this.prisma.departamento.findFirst({
      where: {
        id: createMultaDto.departamentoId,
        subsedeId: userSubsedeId,
        deletedAt: null,
      },
    });

    if (!departamento) {
      throw new NotFoundException(
        `Departamento con ID ${createMultaDto.departamentoId} no encontrado o no pertenece a su municipio`,
      );
    }

    // Verificar código único en la subsede
    const existingMulta = await this.prisma.multa.findFirst({
      where: {
        subsedeId: userSubsedeId,
        codigo: createMultaDto.codigo,
        deletedAt: null,
      },
    });

    if (existingMulta) {
      throw new ConflictException(
        `Ya existe una multa con el código "${createMultaDto.codigo}" en este municipio`,
      );
    }

    // Crear multa
    return this.prisma.multa.create({
      data: {
        ...createMultaDto,
        sedeId: userSedeId,
        subsedeId: userSubsedeId,
        createdBy: userId,
      },
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
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });
  }

  /**
   * Actualizar multa
   * - Valida que la multa pertenece a la subsede del usuario
   * - Si se cambia el código, valida unicidad
   * - Valida que al menos uno de los montos existe si se actualizan
   * - Si se cambia departamentoId, valida que pertenece a la subsede del usuario
   */
  async update(
    id: number,
    updateMultaDto: UpdateMultaDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    // Obtener multa existente con validación de acceso
    const multa = await this.findOneInternal(
      id,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Si se actualiza el departamentoId, validar que existe y pertenece a la subsede
    if (updateMultaDto.departamentoId !== undefined && updateMultaDto.departamentoId !== multa.departamentoId) {
      const departamento = await this.prisma.departamento.findFirst({
        where: {
          id: updateMultaDto.departamentoId,
          subsedeId: multa.subsedeId,
          deletedAt: null,
        },
      });

      if (!departamento) {
        throw new NotFoundException(
          `Departamento con ID ${updateMultaDto.departamentoId} no encontrado o no pertenece a este municipio`,
        );
      }
    }

    // Si se actualiza el código, verificar unicidad
    if (updateMultaDto.codigo && updateMultaDto.codigo !== multa.codigo) {
      const existingMulta = await this.prisma.multa.findFirst({
        where: {
          subsedeId: multa.subsedeId,
          codigo: updateMultaDto.codigo,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingMulta) {
        throw new ConflictException(
          `Ya existe una multa con el código "${updateMultaDto.codigo}" en este municipio`,
        );
      }
    }

    // Si se están actualizando montos, validar que al menos uno existe
    const updatingMontos = 
      updateMultaDto.costo !== undefined ||
      updateMultaDto.numUMAs !== undefined ||
      updateMultaDto.numSalarios !== undefined;

    if (updatingMontos) {
      const newCosto = updateMultaDto.costo !== undefined ? updateMultaDto.costo : multa.costo;
      const newNumUMAs = updateMultaDto.numUMAs !== undefined ? updateMultaDto.numUMAs : multa.numUMAs;
      const newNumSalarios = updateMultaDto.numSalarios !== undefined ? updateMultaDto.numSalarios : multa.numSalarios;

      if (!newCosto && !newNumUMAs && !newNumSalarios) {
        throw new BadRequestException(
          'Debe mantener al menos uno de: costo, numUMAs o numSalarios',
        );
      }
    }

    // Actualizar multa
    return this.prisma.multa.update({
      where: { id },
      data: updateMultaDto,
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
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar multa (soft delete)
   * - Valida que la multa pertenece a la subsede del usuario
   */
  async remove(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    // Validar que la multa existe y el usuario tiene acceso
    await this.findOneInternal(
      id,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Soft delete
    return this.prisma.multa.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Método interno para obtener una multa validando acceso
   * Usado por update y remove
   */
  private async findOneInternal(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir where clause según nivel de acceso
    const whereClause: any = {
      id,
      deletedAt: null,
    };

    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        // ADMIN_ESTATAL: solo multas de su sede
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        // ADMIN_MUNICIPAL: solo multas de su subsede
        if (!userSubsedeId) {
          throw new BadRequestException(
            'El usuario debe tener una subsede asignada',
          );
        }
        whereClause.subsedeId = userSubsedeId;
      }
    }

    const multa = await this.prisma.multa.findFirst({
      where: whereClause,
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
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });

    if (!multa) {
      throw new NotFoundException(
        `Multa con ID ${id} no encontrada o no tienes acceso a ella`,
      );
    }

    return multa;
  }
}

