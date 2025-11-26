import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgenteDto } from '../dto/create-agente.dto';
import { UpdateAgenteDto } from '../dto/update-agente.dto';

/**
 * Servicio para operaciones CRUD de agentes
 */
@Injectable()
export class AgenteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo agente
   */
  async create(
    createAgenteDto: CreateAgenteDto,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ) {
    // Validar que el usuario tenga subsedeId
    if (!userSubsedeId) {
      throw new BadRequestException(
        'El usuario debe tener una subsede asignada para crear agentes',
      );
    }

    // Verificar que el tipo de agente existe y está activo
    const tipoAgente = await this.prisma.tipoAgente.findFirst({
      where: {
        id: createAgenteDto.tipoId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!tipoAgente) {
      throw new NotFoundException(
        `Tipo de agente con ID ${createAgenteDto.tipoId} no encontrado o inactivo`,
      );
    }

    // Verificar que numPlantilla es único en la subsede
    const existingAgente = await this.prisma.agente.findFirst({
      where: {
        subsedeId: userSubsedeId,
        numPlantilla: createAgenteDto.numPlantilla,
        deletedAt: null,
      },
    });

    if (existingAgente) {
      throw new ConflictException(
        `Ya existe un agente con el número de plantilla "${createAgenteDto.numPlantilla}" en este municipio`,
      );
    }

    // Verificar que el departamento existe si se proporciona
    if (createAgenteDto.departamentoId) {
      const departamento = await this.prisma.departamento.findFirst({
        where: {
          id: createAgenteDto.departamentoId,
          subsedeId: userSubsedeId,
          deletedAt: null,
        },
      });

      if (!departamento) {
        throw new NotFoundException(
          `Departamento con ID ${createAgenteDto.departamentoId} no encontrado o no pertenece a su municipio`,
        );
      }
    }

    // Hashear contraseña si se proporciona
    let hashedPassword: string | undefined;
    if (createAgenteDto.contrasena) {
      hashedPassword = await bcrypt.hash(createAgenteDto.contrasena, 10);
    }

    // Crear el agente
    return this.prisma.agente.create({
      data: {
        ...createAgenteDto,
        contrasena: hashedPassword,
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
        tipo: {
          select: {
            id: true,
            tipo: true,
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
   * Actualizar un agente existente
   */
  async update(
    id: number,
    updateAgenteDto: UpdateAgenteDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar que el agente existe y el usuario tiene acceso
    const agente = await this.findOneInternal(
      id,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Si se cambia el tipo de agente, verificar que existe
    if (updateAgenteDto.tipoId && updateAgenteDto.tipoId !== agente.tipoId) {
      const tipoAgente = await this.prisma.tipoAgente.findFirst({
        where: {
          id: updateAgenteDto.tipoId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!tipoAgente) {
        throw new NotFoundException(
          `Tipo de agente con ID ${updateAgenteDto.tipoId} no encontrado o inactivo`,
        );
      }
    }

    // Si se cambia numPlantilla, verificar unicidad
    if (
      updateAgenteDto.numPlantilla &&
      updateAgenteDto.numPlantilla !== agente.numPlantilla
    ) {
      const existingAgente = await this.prisma.agente.findFirst({
        where: {
          subsedeId: agente.subsedeId,
          numPlantilla: updateAgenteDto.numPlantilla,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingAgente) {
        throw new ConflictException(
          `Ya existe un agente con el número de plantilla "${updateAgenteDto.numPlantilla}" en este municipio`,
        );
      }
    }

    // Si se cambia departamentoId, verificar que existe
    if (
      updateAgenteDto.departamentoId !== undefined &&
      updateAgenteDto.departamentoId !== agente.departamentoId
    ) {
      const departamento = await this.prisma.departamento.findFirst({
        where: {
          id: updateAgenteDto.departamentoId,
          subsedeId: agente.subsedeId,
          deletedAt: null,
        },
      });

      if (!departamento) {
        throw new NotFoundException(
          `Departamento con ID ${updateAgenteDto.departamentoId} no encontrado o no pertenece a este municipio`,
        );
      }
    }

    // Hashear nueva contraseña si se proporciona
    let hashedPassword: string | undefined;
    if (updateAgenteDto.contrasena) {
      hashedPassword = await bcrypt.hash(updateAgenteDto.contrasena, 10);
    }

    // Actualizar agente
    return this.prisma.agente.update({
      where: { id },
      data: {
        ...updateAgenteDto,
        ...(hashedPassword && { contrasena: hashedPassword }),
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
        tipo: {
          select: {
            id: true,
            tipo: true,
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
   * Eliminar (soft delete) un agente
   */
  async remove(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar que el agente existe y el usuario tiene acceso
    await this.findOneInternal(
      id,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Soft delete
    return this.prisma.agente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Método interno para validar acceso y existencia
   */
  private async findOneInternal(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles.includes('Super Administrador');

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

    const agente = await this.prisma.agente.findFirst({
      where: whereClause,
    });

    if (!agente) {
      throw new NotFoundException(
        `Agente con ID ${id} no encontrado o sin acceso`,
      );
    }

    return agente;
  }
}
