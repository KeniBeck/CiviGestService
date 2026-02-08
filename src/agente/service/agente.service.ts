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

    // Verificar que numPlaca es único en la subsede
    const existingAgente = await this.prisma.agente.findFirst({
      where: {
        subsedeId: userSubsedeId,
        numPlaca: createAgenteDto.numPlaca,
        deletedAt: null,
      },
    });

    if (existingAgente) {
      throw new ConflictException(
        `Ya existe un agente con el número de plantilla "${createAgenteDto.numPlaca}" en este municipio`,
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

    // Verificar que la patrulla existe si se proporciona
    if (createAgenteDto.patrullaId) {
      const patrulla = await this.prisma.patrulla.findFirst({
        where: {
          id: createAgenteDto.patrullaId,
          subsedeId: userSubsedeId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!patrulla) {
        throw new BadRequestException(
          `Patrulla con ID ${createAgenteDto.patrullaId} no encontrada, inactiva o no pertenece a su municipio`,
        );
      }
    }

    // ✅ HASHEAR CONTRASEÑA: Si se proporciona, usarla; si no, usar numPlaca
    const passwordToHash = createAgenteDto.contrasena || createAgenteDto.numPlaca;
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // Crear el agente
    const agente = await this.prisma.agente.create({
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
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            name: true,
            code: true,
          },
        },
        tipo: {
          select: {
            tipo: true,
          },
        },
        departamento: {
          select: {
            nombre: true,
            descripcion: true,
          },
        },
        patrulla: {
          select: {
            numPatrulla: true,
          },
        },
      },
    });

    // ✅ ASIGNAR ROL "Agente de Tránsito" automáticamente
    const rolAgente = await this.prisma.role.findFirst({
      where: {
        name: 'Agente de Tránsito',
        isGlobal: true,
        isActive: true,
      },
    });

    if (rolAgente) {
      await this.prisma.agenteRol.create({
        data: {
          agenteId: agente.id,
          roleId: rolAgente.id,
          assignedBy: userId,
        },
      });
    }

    return agente;
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

    // Si se cambia numPlaca, verificar unicidad
    if (
      updateAgenteDto.numPlaca &&
      updateAgenteDto.numPlaca !== agente.numPlaca
    ) {
      const existingAgente = await this.prisma.agente.findFirst({
        where: {
          subsedeId: agente.subsedeId,
          numPlaca: updateAgenteDto.numPlaca,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingAgente) {
        throw new ConflictException(
          `Ya existe un agente con el número de plantilla "${updateAgenteDto.numPlaca}" en este municipio`,
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

    // Si se cambia patrullaId, verificar que existe y pertenece a la misma subsede
    if (
      updateAgenteDto.patrullaId !== undefined &&
      updateAgenteDto.patrullaId !== agente.patrullaId
    ) {
      if (updateAgenteDto.patrullaId !== null) {
        const patrulla = await this.prisma.patrulla.findFirst({
          where: {
            id: updateAgenteDto.patrullaId,
            subsedeId: agente.subsedeId,
            isActive: true,
            deletedAt: null,
          },
        });

        if (!patrulla) {
          throw new BadRequestException(
            `Patrulla con ID ${updateAgenteDto.patrullaId} no encontrada, inactiva o no pertenece al mismo municipio`,
          );
        }
      }
      // Si patrullaId es null, se permite (desasignar patrulla)
    }

    // ✅ Si se actualiza el correo, validar que sea único
    if (updateAgenteDto.correo && updateAgenteDto.correo !== agente.correo) {
      const existingAgente = await this.prisma.agente.findUnique({
        where: { correo: updateAgenteDto.correo },
      });

      if (existingAgente) {
        throw new BadRequestException('El correo ya está en uso');
      }
    }

    // ✅ NO permitir actualizar contraseña desde este endpoint
    // La contraseña solo se cambia desde /agentes/auth/change-password
    const { contrasena, ...safeUpdateDto } = updateAgenteDto as any;

    // Actualizar agente
    return this.prisma.agente.update({
      where: { id },
      data: safeUpdateDto,
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
