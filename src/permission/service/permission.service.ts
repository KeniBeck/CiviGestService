import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { RoleLevel } from '@prisma/client';
import { PermissionFinderService } from './permission-finder.service';

/**
 * PermissionService - Gestión de Permisos del Sistema
 *
 * Los permisos son los bloques básicos del sistema de autorización.
 * Solo usuarios con roles administrativos pueden gestionar permisos.
 *
 * REGLAS:
 * - SUPER_ADMIN: CRUD completo de permisos
 * - ESTATAL: Solo lectura de permisos
 * - MUNICIPAL: Solo lectura de permisos
 * - OPERATIVO: Solo lectura de permisos
 */
@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionFinderService: PermissionFinderService,
  ) {}

  /**
   * Crear un nuevo permiso
   * Solo Super Admin puede crear permisos
   */
  async create(
    createPermissionDto: CreatePermissionDto,
    userRoleLevel: RoleLevel,
  ): Promise<any> {
    // Validar que solo Super Admin puede crear permisos
    this.validateIsSuperAdmin(userRoleLevel, 'crear permisos');

    // Verificar que no exista un permiso con ese resource:action
    const existingPermission = await this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: createPermissionDto.resource,
          action: createPermissionDto.action,
        },
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Ya existe un permiso con resource "${createPermissionDto.resource}" y action "${createPermissionDto.action}"`,
      );
    }

    // Crear el permiso
    return this.prisma.permission.create({
      data: {
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
        description: createPermissionDto.description,
        isActive: createPermissionDto.isActive ?? true,
      },
    });
  }

  /**
   * Actualizar un permiso existente
   * Solo Super Admin puede actualizar permisos
   */
  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
    userRoleLevel: RoleLevel,
  ): Promise<any> {
    // Validar que solo Super Admin puede actualizar permisos
    this.validateIsSuperAdmin(userRoleLevel, 'actualizar permisos');

    // Buscar el permiso
    const permission = await this.permissionFinderService.findOne(
      id,
      userRoleLevel,
    );

    // Si se está cambiando resource o action, verificar que no exista
    if (
      (updatePermissionDto.resource &&
        updatePermissionDto.resource !== permission.resource) ||
      (updatePermissionDto.action &&
        updatePermissionDto.action !== permission.action)
    ) {
      const newResource = updatePermissionDto.resource || permission.resource;
      const newAction = updatePermissionDto.action || permission.action;

      const existingPermission = await this.prisma.permission.findUnique({
        where: {
          resource_action: {
            resource: newResource,
            action: newAction,
          },
        },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException(
          `Ya existe un permiso con resource "${newResource}" y action "${newAction}"`,
        );
      }
    }

    // Actualizar el permiso
    return this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }

  /**
   * Desactivar un permiso
   * Solo Super Admin puede desactivar permisos
   * NO se elimina físicamente porque puede estar en uso
   */
  async remove(id: number, userRoleLevel: RoleLevel): Promise<any> {
    // Validar que solo Super Admin puede eliminar permisos
    this.validateIsSuperAdmin(userRoleLevel, 'eliminar permisos');

    // Buscar el permiso
    const permission = await this.permissionFinderService.findOne(
      id,
      userRoleLevel,
    );

    // Verificar si está en uso
    const usageCount = await this.prisma.rolePermission.count({
      where: { permissionId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar el permiso porque está asignado a ${usageCount} rol(es). Se desactivará en su lugar.`,
      );
    }

    // Desactivar el permiso
    return this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Reactivar un permiso desactivado
   * Solo Super Admin puede reactivar permisos
   */
  async activate(id: number, userRoleLevel: RoleLevel): Promise<any> {
    // Validar que solo Super Admin puede reactivar permisos
    this.validateIsSuperAdmin(userRoleLevel, 'reactivar permisos');

    // Verificar que el permiso existe
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    // Reactivar el permiso
    return this.prisma.permission.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Validar que el usuario es Super Admin
   */
  private validateIsSuperAdmin(userRoleLevel: RoleLevel, action: string): void {
    if (userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        `Solo Super Administradores pueden ${action}`,
      );
    }
  }
}
