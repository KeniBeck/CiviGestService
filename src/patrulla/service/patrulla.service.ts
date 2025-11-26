import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatrullaDto } from '../dto/create-patrulla.dto';
import { UpdatePatrullaDto } from '../dto/update-patrulla.dto';

/**
 * Servicio para operaciones CRUD de patrullas
 */
@Injectable()
export class PatrullaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear nueva patrulla
   */
  async create(
    createDto: CreatePatrullaDto,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ) {
    // Validar que el usuario tenga subsede asignada
    if (!userSubsedeId) {
      throw new BadRequestException(
        'El usuario debe tener una subsede asignada para crear patrullas',
      );
    }

    // Verificar que el agente existe, está activo y pertenece a la MISMA subsede
    const agente = await this.prisma.agente.findFirst({
      where: {
        id: createDto.agenteId,
        deletedAt: null,
        isActive: true,
        subsedeId: userSubsedeId,
      },
    });

    if (!agente) {
      throw new BadRequestException(
        `El agente con ID ${createDto.agenteId} no existe, no está activo o no pertenece a su municipio`,
      );
    }

    // Verificar que la placa sea única globalmente
    const existingPlaca = await this.prisma.patrulla.findFirst({
      where: {
        placa: createDto.placa,
        deletedAt: null,
      },
    });

    if (existingPlaca) {
      throw new ConflictException(
        `Ya existe una patrulla con la placa ${createDto.placa}`,
      );
    }

    // Verificar que el numPatrulla sea único en la subsede
    const existingNumPatrulla = await this.prisma.patrulla.findFirst({
      where: {
        subsedeId: userSubsedeId,
        numPatrulla: createDto.numPatrulla,
        deletedAt: null,
      },
    });

    if (existingNumPatrulla) {
      throw new ConflictException(
        `Ya existe una patrulla con el número ${createDto.numPatrulla} en este municipio`,
      );
    }

    // Crear la patrulla
    return this.prisma.patrulla.create({
      data: {
        ...createDto,
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
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlantilla: true,
            tipo: {
              select: {
                id: true,
                tipo: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Actualizar patrulla
   */
  async update(
    id: number,
    updateDto: UpdatePatrullaDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Verificar ownership
    const patrulla = await this.findOneInternal(
      id,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Si cambia el agente, verificar que existe, está activo y pertenece a la misma subsede
    if (updateDto.agenteId && updateDto.agenteId !== patrulla.agenteId) {
      const agente = await this.prisma.agente.findFirst({
        where: {
          id: updateDto.agenteId,
          deletedAt: null,
          isActive: true,
          subsedeId: patrulla.subsedeId,
        },
      });

      if (!agente) {
        throw new BadRequestException(
          `El agente con ID ${updateDto.agenteId} no existe, no está activo o no pertenece al mismo municipio`,
        );
      }
    }

    // Si cambia la placa, verificar unicidad global
    if (updateDto.placa && updateDto.placa !== patrulla.placa) {
      const existingPlaca = await this.prisma.patrulla.findFirst({
        where: {
          placa: updateDto.placa,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingPlaca) {
        throw new ConflictException(
          `Ya existe una patrulla con la placa ${updateDto.placa}`,
        );
      }
    }

    // Si cambia el numPatrulla, verificar unicidad en subsede
    if (updateDto.numPatrulla && updateDto.numPatrulla !== patrulla.numPatrulla) {
      const existingNumPatrulla = await this.prisma.patrulla.findFirst({
        where: {
          subsedeId: patrulla.subsedeId,
          numPatrulla: updateDto.numPatrulla,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existingNumPatrulla) {
        throw new ConflictException(
          `Ya existe una patrulla con el número ${updateDto.numPatrulla} en este municipio`,
        );
      }
    }

    // Actualizar
    return this.prisma.patrulla.update({
      where: { id },
      data: updateDto,
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
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlantilla: true,
            tipo: {
              select: {
                id: true,
                tipo: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Eliminar patrulla (soft delete)
   */
  async remove(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Verificar ownership
    await this.findOneInternal(id, userSedeId, userSubsedeId, accessLevel, roles);

    // Soft delete
    return this.prisma.patrulla.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Método interno para validar ownership
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

    const patrulla = await this.prisma.patrulla.findFirst({
      where: whereClause,
    });

    if (!patrulla) {
      throw new NotFoundException(
        `Patrulla con ID ${id} no encontrada o sin acceso`,
      );
    }

    return patrulla;
  }
}
