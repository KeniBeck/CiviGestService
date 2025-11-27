import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfiguracionDto } from '../dto/create-configuracion.dto';
import { UpdateConfiguracionDto } from '../dto/update-configuracion.dto';
import { AccessLevel } from '@prisma/client';

/**
 * ConfiguracionService - Gestión de Configuraciones de Municipios
 * 
 * Relación 1:1 con Subsede: UNA subsede tiene UNA ÚNICA configuración
 * Multi-tenancy: Usuarios operan SOLO en su(s) subsede(s)
 */
@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear nueva configuración para una subsede
   * Solo una configuración por subsede (relación 1:1)
   */
  async create(
    createDto: CreateConfiguracionDto,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
    accessLevel: AccessLevel,
    subsedeAccessIds: number[],
  ) {
    // Determinar subsedeId: usar la del usuario o la primera con acceso
    const subsedeId = userSubsedeId || subsedeAccessIds[0];

    if (!subsedeId) {
      throw new BadRequestException(
        'No se pudo determinar la subsede para crear la configuración',
      );
    }

    // Verificar que la subsede NO tenga ya una configuración
    const existingConfig = await this.prisma.configuracion.findFirst({
      where: {
        subsedeId,
        deletedAt: null,
      },
    });

    if (existingConfig) {
      throw new ConflictException(
        'Esta subsede ya tiene una configuración. Use PATCH para actualizarla.',
      );
    }

    // Si viene themeId, verificar que existe y está activo
    if (createDto.themeId) {
      const theme = await this.prisma.theme.findFirst({
        where: {
          id: createDto.themeId,
        },
      });

      if (!theme) {
        throw new NotFoundException(
          `Tema con ID ${createDto.themeId} no encontrado`,
        );
      }
    }

    // Crear la configuración
    return this.prisma.configuracion.create({
      data: {
        ...createDto,
        sedeId: userSedeId,
        subsedeId,
        createdBy: userId,
        pais: createDto.pais || 'México',
        tasaRecargo: createDto.tasaRecargo || 0,
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
        theme: true,
      },
    });
  }

  /**
   * Actualizar configuración existente
   * No permite cambiar subsedeId (relación 1:1)
   */
  async update(
    id: number,
    updateDto: UpdateConfiguracionDto,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
    accessLevel: AccessLevel,
    roles: string[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Buscar configuración
    const configuracion = await this.prisma.configuracion.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!configuracion) {
      throw new NotFoundException(`Configuración con ID ${id} no encontrada`);
    }

    // Validar acceso según nivel
    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        // Admin Estatal: solo configuraciones de su sede
        if (configuracion.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes acceso a esta configuración',
          );
        }
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        // Admin Municipal: solo configuración de su(s) subsede(s)
        const accessibleSubsedeIds = [
          ...(userSubsedeId ? [userSubsedeId] : []),
          ...subsedeAccessIds,
        ];

        if (!accessibleSubsedeIds.includes(configuracion.subsedeId)) {
          throw new ForbiddenException(
            'No tienes acceso a esta configuración',
          );
        }
      }
    }

    // Si cambia themeId, verificar que existe
    if (updateDto.themeId !== undefined && updateDto.themeId !== null) {
      const theme = await this.prisma.theme.findFirst({
        where: {
          id: updateDto.themeId,
        },
      });

      if (!theme) {
        throw new NotFoundException(
          `Tema con ID ${updateDto.themeId} no encontrado`,
        );
      }
    }

    // Actualizar
    return this.prisma.configuracion.update({
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
        theme: true,
      },
    });
  }

  /**
   * Eliminar configuración (soft delete)
   */
  async remove(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Buscar configuración
    const configuracion = await this.prisma.configuracion.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!configuracion) {
      throw new NotFoundException(`Configuración con ID ${id} no encontrada`);
    }

    // Validar acceso
    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        if (configuracion.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes acceso a esta configuración',
          );
        }
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(userSubsedeId ? [userSubsedeId] : []),
          ...subsedeAccessIds,
        ];

        if (!accessibleSubsedeIds.includes(configuracion.subsedeId)) {
          throw new ForbiddenException(
            'No tienes acceso a esta configuración',
          );
        }
      }
    }

    // Soft delete
    return this.prisma.configuracion.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

