import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';
import { AccessLevel } from '@prisma/client';

/**
 * SedesService - Gestión de Sedes (Departamentos/Clientes)
 * 
 * IMPORTANTE: Sede es el nivel superior en CiviGest
 * - Representa al departamento/cliente que contrata el servicio
 * - Solo SUPER_ADMIN puede crear nuevas Sedes
 * - Los usuarios pertenecen a una Sede, no a un Tenant
 */
@Injectable()
export class SedesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear nueva sede (departamento/cliente)
   * Solo usuarios SUPER_ADMIN pueden crear sedes
   */
  async create(createSedeDto: CreateSedeDto, userId: number) {
    // Evitar que un `id` enviado en el DTO provoque conflicto con la PK
    const { id, ...sedeData } = createSedeDto as any;

    // Verificar que no exista una sede con el mismo código
    const existingSede = await this.prisma.sede.findFirst({
      where: {
        code: sedeData.code,
        deletedAt: null,
      },
    });

    if (existingSede) {
      throw new ConflictException(
        `Ya existe una sede con el código ${sedeData.code}`,
      );
    }

    // Verificar que el email no esté en uso
    const existingEmail = await this.prisma.sede.findFirst({
      where: {
        email: sedeData.email,
        deletedAt: null,
      },
    });

    if (existingEmail) {
      throw new ConflictException(
        `Ya existe una sede con el email ${sedeData.email}`,
      );
    }

    // Preparar datos para crear la sede
    const createData = {
      ...sedeData,
      createdBy: userId,
      latitude: sedeData.latitude
        ? parseFloat(sedeData.latitude)
        : null,
      longitude: sedeData.longitude
        ? parseFloat(sedeData.longitude)
        : null,
    };

    try {
      // Crear la sede
      return await this.prisma.sede.create({
        data: createData,
        include: {
          _count: {
            select: {
              subsedes: true,
              users: true,
            },
          },
        },
      });
    } catch (error: any) {
      // Manejar errores de clave única duplicada
      if (error?.code === 'P2002') {
        const field = error?.meta?.target?.[0] || 'campo único';
        throw new ConflictException(
          `Conflicto al crear la sede: ${field} ya existe`,
        );
      }
      throw error;
    }
  }

  /**
   * Actualizar sede
   * Solo SUPER_ADMIN o usuarios con permisos específicos pueden actualizar
   */
  async update(
    id: number,
    updateSedeDto: UpdateSedeDto,
    userSedeId: number,
    accessLevel: AccessLevel,
    userId: number,
    roles?: string[],
  ) {
    // Verificar que la sede existe
    const sede = await this.prisma.sede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }

    // Si es Super Administrador, puede actualizar cualquier sede
    const isSuperAdmin = roles?.includes('Super Administrador');
    
    if (!isSuperAdmin) {
      // Validar acceso (solo puede actualizar su propia sede o con acceso explícito)
      if (accessLevel === AccessLevel.SEDE) {
        if (id !== userSedeId) {
          const hasAccess = await this.prisma.userSedeAccess.findFirst({
            where: {
              userId,
              sedeId: id,
              isActive: true,
            },
          });

          if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso para actualizar esta sede');
          }
        }
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        throw new ForbiddenException('No tienes permisos para actualizar sedes');
      }
    }

    // Si se cambia el código, verificar que no exista otro con ese código
    if (updateSedeDto.code && updateSedeDto.code !== sede.code) {
      const existingSede = await this.prisma.sede.findFirst({
        where: {
          code: updateSedeDto.code,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingSede) {
        throw new ConflictException(
          `Ya existe una sede con el código ${updateSedeDto.code}`,
        );
      }
    }

    // Si se cambia el email, verificar que no esté en uso
    if (updateSedeDto.email && updateSedeDto.email !== sede.email) {
      const existingEmail = await this.prisma.sede.findFirst({
        where: {
          email: updateSedeDto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingEmail) {
        throw new ConflictException(
          `Ya existe una sede con el email ${updateSedeDto.email}`,
        );
      }
    }

    // Actualizar la sede
    return this.prisma.sede.update({
      where: { id },
      data: {
        ...updateSedeDto,
        latitude: updateSedeDto.latitude
          ? parseFloat(updateSedeDto.latitude)
          : undefined,
        longitude: updateSedeDto.longitude
          ? parseFloat(updateSedeDto.longitude)
          : undefined,
      },
      include: {
        _count: {
          select: {
            subsedes: true,
            users: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete de una sede
   * Solo SUPER_ADMIN pueden eliminar sedes
   */
  async remove(id: number) {
    const sede = await this.prisma.sede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }

    // Soft delete
    return this.prisma.sede.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Activar/Desactivar sede
   * Solo SUPER_ADMIN pueden cambiar el estado
   */
  async toggleActive(id: number) {
    const sede = await this.prisma.sede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }

    return this.prisma.sede.update({
      where: { id },
      data: {
        isActive: !sede.isActive,
      },
    });
  }
}
