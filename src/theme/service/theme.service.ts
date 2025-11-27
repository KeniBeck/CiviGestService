import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateThemeDto } from '../dto/create-theme.dto';
import { UpdateThemeDto } from '../dto/update-theme.dto';

/**
 * ThemeService - Gestión de Temas Visuales
 * 
 * Los temas son globales del sistema (sin multi-tenancy)
 * Solo SUPER_ADMIN puede crear, actualizar y eliminar
 * Todos los usuarios autenticados pueden leer
 */
@Injectable()
export class ThemeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear nuevo tema
   * Solo SUPER_ADMIN puede crear temas
   */
  async create(createDto: CreateThemeDto, userRoles: string[]) {
    // Verificar que user es SUPER_ADMIN
    const isSuperAdmin = userRoles.includes('Super Administrador');
    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Solo Super Administradores pueden crear temas',
      );
    }

    // Verificar que name no existe (único)
    const existingTheme = await this.prisma.theme.findFirst({
      where: {
        name: createDto.name,
      },
    });

    if (existingTheme) {
      throw new ConflictException(
        `Ya existe un tema con el nombre "${createDto.name}"`,
      );
    }

    // Si isDefault = true: poner todos los demás temas en isDefault = false
    if (createDto.isDefault === true) {
      await this.prisma.theme.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Crear tema
    return this.prisma.theme.create({
      data: {
        ...createDto,
        darkMode: createDto.darkMode ?? false,
        isDefault: createDto.isDefault ?? false,
      },
    });
  }

  /**
   * Actualizar tema existente
   * Solo SUPER_ADMIN puede actualizar
   */
  async update(id: number, updateDto: UpdateThemeDto, userRoles: string[]) {
    // Verificar que user es SUPER_ADMIN
    const isSuperAdmin = userRoles.includes('Super Administrador');
    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Solo Super Administradores pueden actualizar temas',
      );
    }

    // Verificar que el tema existe
    const theme = await this.prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException(`Tema con ID ${id} no encontrado`);
    }

    // Si cambia name: verificar unicidad
    if (updateDto.name && updateDto.name !== theme.name) {
      const existingTheme = await this.prisma.theme.findFirst({
        where: {
          name: updateDto.name,
          id: { not: id },
        },
      });

      if (existingTheme) {
        throw new ConflictException(
          `Ya existe un tema con el nombre "${updateDto.name}"`,
        );
      }
    }

    // Si cambia isDefault a true: poner todos los demás en false
    if (updateDto.isDefault === true && !theme.isDefault) {
      await this.prisma.theme.updateMany({
        where: {
          id: { not: id },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Actualizar tema
    return this.prisma.theme.update({
      where: { id },
      data: updateDto,
    });
  }

  /**
   * Eliminar tema (hard delete)
   * Solo SUPER_ADMIN puede eliminar
   */
  async remove(id: number, userRoles: string[]) {
    // Verificar que user es SUPER_ADMIN
    const isSuperAdmin = userRoles.includes('Super Administrador');
    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Solo Super Administradores pueden eliminar temas',
      );
    }

    // Verificar que el tema existe
    const theme = await this.prisma.theme.findUnique({
      where: { id },
      include: {
        configuraciones: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!theme) {
      throw new NotFoundException(`Tema con ID ${id} no encontrado`);
    }

    // Verificar que NO sea el tema por defecto
    if (theme.isDefault) {
      throw new BadRequestException(
        'No se puede eliminar el tema por defecto del sistema',
      );
    }

    // Verificar que no tenga configuraciones asociadas activas
    if (theme.configuraciones.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el tema porque tiene ${theme.configuraciones.length} configuraciones asociadas`,
      );
    }

    // Eliminar permanentemente (hard delete)
    await this.prisma.theme.delete({
      where: { id },
    });

    return {
      message: `Tema "${theme.name}" eliminado exitosamente`,
    };
  }
}

