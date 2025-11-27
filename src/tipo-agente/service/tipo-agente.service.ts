import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTipoAgenteDto } from '../dto/create-tipo-agente.dto';
import { UpdateTipoAgenteDto } from '../dto/update-tipo-agente.dto';

/**
 * Servicio principal para gestión de tipos de agente (CRUD)
 */
@Injectable()
export class TipoAgenteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo tipo de agente
   */
  async create(
    createDto: CreateTipoAgenteDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Solo admins municipales pueden crear tipos
    if (accessLevel !== 'SUBSEDE' && !roles.includes('Super Administrador')) {
      throw new BadRequestException(
        'Solo los administradores municipales pueden crear tipos de agente',
      );
    }

    if (!userSubsedeId) {
      throw new BadRequestException(
        'Se requiere un municipio para crear tipos de agente',
      );
    }

    // Validar que el tipo sea único en el municipio
    const existingTipo = await this.prisma.tipoAgente.findFirst({
      where: {
        subsedeId: userSubsedeId,
        tipo: createDto.tipo.trim(),
        deletedAt: null,
      },
    });

    if (existingTipo) {
      throw new ConflictException(
        `Ya existe un tipo de agente con el nombre "${createDto.tipo}" en este municipio`,
      );
    }

    // Crear el tipo de agente
    return this.prisma.tipoAgente.create({
      data: {
        tipo: createDto.tipo.trim(),
        sedeId: userSedeId,
        subsedeId: userSubsedeId,
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
        _count: {
          select: {
            agentes: true,
          },
        },
      },
    });
  }

  /**
   * Actualizar un tipo de agente
   */
  async update(
    id: number,
    updateDto: UpdateTipoAgenteDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Verificar que el tipo existe y pertenece al usuario
    const tipoAgente = await this.findOneInternal(
      id,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Si se está actualizando el tipo, validar unicidad
    if (updateDto.tipo) {
      const existingTipo = await this.prisma.tipoAgente.findFirst({
        where: {
          subsedeId: tipoAgente.subsedeId,
          tipo: updateDto.tipo.trim(),
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingTipo) {
        throw new ConflictException(
          `Ya existe un tipo de agente con el nombre "${updateDto.tipo}" en este municipio`,
        );
      }
    }

    // Actualizar
    return this.prisma.tipoAgente.update({
      where: { id },
      data: {
        ...(updateDto.tipo && { tipo: updateDto.tipo.trim() }),
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
        _count: {
          select: {
            agentes: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar un tipo de agente (soft delete)
   */
  async remove(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Verificar que el tipo existe y pertenece al usuario
    await this.findOneInternal(id, userSedeId, userSubsedeId, accessLevel, roles);

    // Verificar si tiene agentes asociados
    const agenteCount = await this.prisma.agente.count({
      where: {
        tipoId: id,
        deletedAt: null,
      },
    });

    if (agenteCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar el tipo de agente porque tiene ${agenteCount} agente(s) asociado(s)`,
      );
    }

    // Soft delete
    return this.prisma.tipoAgente.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Método interno para validar acceso al tipo de agente
   */
  private async findOneInternal(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    const whereClause: any = {
      id,
      deletedAt: null,
    };

    // Control de acceso multi-tenant
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    const tipoAgente = await this.prisma.tipoAgente.findFirst({
      where: whereClause,
    });

    if (!tipoAgente) {
      throw new NotFoundException(
        `Tipo de agente con ID ${id} no encontrado o no tiene acceso`,
      );
    }

    return tipoAgente;
  }
}
