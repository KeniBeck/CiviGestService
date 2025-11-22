import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubsedeDto } from '../dto/create-sudsede.dto';
import { UpdateSubsedeDto } from '../dto/update-sudsede.dto';
import { AccessLevel } from '@prisma/client';

/**
 * SubsedesService - Gestión de Subsedes (Municipios/Oficinas)
 * 
 * IMPORTANTE: Subsede pertenece a una Sede
 * - Super Admin puede crear subsedes en cualquier sede
 * - Usuarios SEDE pueden crear subsedes en su propia sede
 * - Usuarios SUBSEDE no pueden crear subsedes
 */
@Injectable()
export class SubsedesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear nueva subsede (municipio/oficina)
   * Super Admin: puede crear en cualquier sede
   * Usuario SEDE: solo en su propia sede
   */
  async create(
    createSubsedeDto: CreateSubsedeDto,
    userId: number,
    userSedeId: number,
    accessLevel: AccessLevel,
    roles?: string[],
  ) {
    // Evitar que un `id` enviado en el DTO provoque conflicto
    const { id, ...subsedeData } = createSubsedeDto as any;

    const isSuperAdmin = roles?.includes('Super Administrador');

    // Si no es Super Admin, validar que solo pueda crear en su propia sede
    if (!isSuperAdmin) {
      if (accessLevel !== AccessLevel.SEDE) {
        throw new ForbiddenException(
          'No tienes permisos para crear subsedes',
        );
      }

      if (subsedeData.sedeId !== userSedeId) {
        throw new ForbiddenException(
          'Solo puedes crear subsedes en tu propia sede',
        );
      }
    }

    // Verificar que la sede existe
    const sede = await this.prisma.sede.findFirst({
      where: {
        id: subsedeData.sedeId,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new NotFoundException(
        `Sede con ID ${subsedeData.sedeId} no encontrada`,
      );
    }

    // Verificar que no exista una subsede con el mismo código en esa sede
    const existingSubsede = await this.prisma.subsede.findFirst({
      where: {
        sedeId: subsedeData.sedeId,
        code: subsedeData.code,
        deletedAt: null,
      },
    });

    if (existingSubsede) {
      throw new ConflictException(
        `Ya existe una subsede con el código ${subsedeData.code} en esta sede`,
      );
    }

    // Preparar datos para crear la subsede
    const createData = {
      ...subsedeData
    };

    try {
      return await this.prisma.subsede.create({
        data: createData,
        include: {
          sede: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              users: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const field = error?.meta?.target?.[0] || 'campo único';
        throw new ConflictException(
          `Conflicto al crear la subsede: ${field} ya existe`,
        );
      }
      throw error;
    }
  }

  /**
   * Actualizar subsede
   * Super Admin: puede actualizar cualquier subsede
   * Usuario SEDE: solo subsedes de su sede
   * Usuario SUBSEDE: solo su propia subsede
   */
  async update(
    id: number,
    updateSubsedeDto: UpdateSubsedeDto,
    userId: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles?: string[],
  ) {
    // Verificar que la subsede existe
    const subsede = await this.prisma.subsede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!subsede) {
      throw new NotFoundException(`Subsede con ID ${id} no encontrada`);
    }

    const isSuperAdmin = roles?.includes('Super Administrador');

    if (!isSuperAdmin) {
      // Validar acceso según nivel
      if (accessLevel === AccessLevel.SEDE) {
        // Puede actualizar subsedes de su propia sede
        if (subsede.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes acceso para actualizar esta subsede',
          );
        }
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        // Solo puede actualizar su propia subsede
        if (id !== userSubsedeId) {
          throw new ForbiddenException(
            'Solo puedes actualizar tu propia subsede',
          );
        }
      }
    }

    // Si se cambia el código, verificar que no exista otro con ese código en la misma sede
    if (updateSubsedeDto.code && updateSubsedeDto.code !== subsede.code) {
      const existingSubsede = await this.prisma.subsede.findFirst({
        where: {
          sedeId: subsede.sedeId,
          code: updateSubsedeDto.code,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingSubsede) {
        throw new ConflictException(
          `Ya existe una subsede con el código ${updateSubsedeDto.code} en esta sede`,
        );
      }
    }

    // Actualizar la subsede
    return this.prisma.subsede.update({
      where: { id },
      data: {
        ...updateSubsedeDto
      },
      include: {
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete de una subsede
   * Super Admin: puede eliminar cualquier subsede
   * Usuario SEDE: solo subsedes de su sede
   */
  async remove(
    id: number,
    userSedeId: number,
    accessLevel: AccessLevel,
    roles?: string[],
  ) {
    const subsede = await this.prisma.subsede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!subsede) {
      throw new NotFoundException(`Subsede con ID ${id} no encontrada`);
    }

    const isSuperAdmin = roles?.includes('Super Administrador');

    if (!isSuperAdmin) {
      if (accessLevel !== AccessLevel.SEDE) {
        throw new ForbiddenException(
          'No tienes permisos para eliminar subsedes',
        );
      }

      if (subsede.sedeId !== userSedeId) {
        throw new ForbiddenException(
          'No tienes acceso para eliminar esta subsede',
        );
      }
    }

    // Soft delete
    return this.prisma.subsede.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Activar/Desactivar subsede
   * Super Admin: cualquier subsede
   * Usuario SEDE: solo de su sede
   */
  async toggleActive(
    id: number,
    userSedeId: number,
    accessLevel: AccessLevel,
    roles?: string[],
  ) {
    const subsede = await this.prisma.subsede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!subsede) {
      throw new NotFoundException(`Subsede con ID ${id} no encontrada`);
    }

    const isSuperAdmin = roles?.includes('Super Administrador');

    if (!isSuperAdmin) {
      if (accessLevel !== AccessLevel.SEDE) {
        throw new ForbiddenException(
          'No tienes permisos para cambiar el estado de subsedes',
        );
      }

      if (subsede.sedeId !== userSedeId) {
        throw new ForbiddenException(
          'No tienes acceso para modificar esta subsede',
        );
      }
    }

    return this.prisma.subsede.update({
      where: { id },
      data: {
        isActive: !subsede.isActive,
      },
    });
  }
}
