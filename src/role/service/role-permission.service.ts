import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleLevel } from '@prisma/client';
import { RoleFinderService } from './role-finder.service';

/**
 * RolePermissionService - Gestión de permisos de roles
 *
 * Este servicio maneja la asignación y remoción de permisos a roles,
 * respetando la jerarquía de niveles.
 *
 * REGLAS:
 * - SUPER_ADMIN: Puede gestionar permisos de cualquier rol
 * - ESTATAL: Puede gestionar permisos de roles ESTATAL y MUNICIPAL
 * - MUNICIPAL: Puede gestionar permisos de roles MUNICIPAL y OPERATIVO
 * - OPERATIVO: NO puede gestionar permisos (solo consulta)
 */
@Injectable()
export class RolePermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleFinderService: RoleFinderService,
  ) {}

  /**
   * Asignar un permiso a un rol
   */
  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ): Promise<any> {
    // Validar que el rol existe y el usuario tiene acceso
    const role = await this.roleFinderService.findOne(
      roleId,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // VALIDACIÓN: Solo Super Admin puede modificar permisos de roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden modificar permisos de roles globales del sistema',
      );
    }

    // Validar que el usuario puede gestionar este nivel de rol
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    // Validar que el permiso existe
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException(
        `Permiso con ID ${permissionId} no encontrado`,
      );
    }

    if (!permission.isActive) {
      throw new BadRequestException(
        `El permiso "${permission.resource}:${permission.action}" está desactivado`,
      );
    }

    // Verificar si ya existe la asignación
    const existingAssignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        `El permiso "${permission.resource}:${permission.action}" ya está asignado al rol`,
      );
    }

    // Asignar el permiso al rol
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
        grantedBy: userId,
      },
      include: {
        permission: true,
      },
    });
  }

  /**
   * Asignar múltiples permisos a un rol
   */
  async assignMultiplePermissionsToRole(
    roleId: number,
    permissionIds: number[],
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ): Promise<{ assigned: number; skipped: number; errors: string[] }> {
    // Validar que el rol existe y el usuario tiene acceso
    const role = await this.roleFinderService.findOne(
      roleId,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // VALIDACIÓN: Solo Super Admin puede modificar permisos de roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden modificar permisos de roles globales del sistema',
      );
    }

    // Validar que el usuario puede gestionar este nivel de rol
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    let assigned = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const permissionId of permissionIds) {
      try {
        // Validar que el permiso existe
        const permission = await this.prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          errors.push(`Permiso ID ${permissionId}: no encontrado`);
          continue;
        }

        if (!permission.isActive) {
          errors.push(
            `Permiso "${permission.resource}:${permission.action}": está desactivado`,
          );
          continue;
        }

        // Verificar si ya existe la asignación
        const existingAssignment = await this.prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId,
            },
          },
        });

        if (existingAssignment) {
          skipped++;
          continue;
        }

        // Asignar el permiso al rol
        await this.prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
            grantedBy: userId,
          },
        });

        assigned++;
      } catch (error) {
        errors.push(
          `Permiso ID ${permissionId}: ${error.message || 'Error desconocido'}`,
        );
      }
    }

    return { assigned, skipped, errors };
  }

  /**
   * Remover un permiso de un rol
   */
  async removePermissionFromRole(
    roleId: number,
    permissionId: number,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<any> {
    // Validar que el rol existe y el usuario tiene acceso
    const role = await this.roleFinderService.findOne(
      roleId,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // VALIDACIÓN: Solo Super Admin puede modificar permisos de roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden modificar permisos de roles globales del sistema',
      );
    }

    // Validar que el usuario puede gestionar este nivel de rol
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    // Verificar que el permiso está asignado al rol
    const assignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `El permiso con ID ${permissionId} no está asignado al rol`,
      );
    }

    // Remover el permiso del rol
    return this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  /**
   * Remover múltiples permisos de un rol
   */
  async removeMultiplePermissionsFromRole(
    roleId: number,
    permissionIds: number[],
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<{ removed: number; notFound: number; errors: string[] }> {
    // Validar que el rol existe y el usuario tiene acceso
    const role = await this.roleFinderService.findOne(
      roleId,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // VALIDACIÓN: Solo Super Admin puede modificar permisos de roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden modificar permisos de roles globales del sistema',
      );
    }

    // Validar que el usuario puede gestionar este nivel de rol
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    let removed = 0;
    let notFound = 0;
    const errors: string[] = [];

    for (const permissionId of permissionIds) {
      try {
        // Verificar que el permiso está asignado al rol
        const assignment = await this.prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId,
            },
          },
        });

        if (!assignment) {
          notFound++;
          continue;
        }

        // Remover el permiso del rol
        await this.prisma.rolePermission.delete({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId,
            },
          },
        });

        removed++;
      } catch (error) {
        errors.push(
          `Permiso ID ${permissionId}: ${error.message || 'Error desconocido'}`,
        );
      }
    }

    return { removed, notFound, errors };
  }

  /**
   * Obtener todos los permisos de un rol
   */
  async getRolePermissions(
    roleId: number,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<any[]> {
    // Validar que el rol existe y el usuario tiene acceso
    await this.roleFinderService.findOne(
      roleId,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // Obtener los permisos del rol
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
      orderBy: [{ permission: { resource: 'asc' } }, { permission: { action: 'asc' } }],
    });

    return rolePermissions.map((rp) => ({
      id: rp.permission.id,
      resource: rp.permission.resource,
      action: rp.permission.action,
      description: rp.permission.description,
      grantedAt: rp.grantedAt,
      grantedBy: rp.grantedBy,
    }));
  }

  /**
   * Sincronizar permisos de un rol (reemplazar todos)
   */
  async syncRolePermissions(
    roleId: number,
    permissionIds: number[],
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ): Promise<{ added: number; removed: number; total: number }> {
    // Validar que el rol existe y el usuario tiene acceso
    const role = await this.roleFinderService.findOne(
      roleId,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // VALIDACIÓN: Solo Super Admin puede modificar permisos de roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden modificar permisos de roles globales del sistema',
      );
    }

    // Validar que el usuario puede gestionar este nivel de rol
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    // Obtener permisos actuales del rol
    const currentPermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    const currentPermissionIds = currentPermissions.map((p) => p.permissionId);

    // Calcular permisos a agregar y remover
    const toAdd = permissionIds.filter(
      (id) => !currentPermissionIds.includes(id),
    );
    const toRemove = currentPermissionIds.filter(
      (id) => !permissionIds.includes(id),
    );

    // Validar que todos los permisos a agregar existen y están activos
    if (toAdd.length > 0) {
      const validPermissions = await this.prisma.permission.findMany({
        where: {
          id: { in: toAdd },
          isActive: true,
        },
      });

      if (validPermissions.length !== toAdd.length) {
        throw new BadRequestException(
          'Algunos permisos no existen o están desactivados',
        );
      }
    }

    // Ejecutar cambios en una transacción
    await this.prisma.$transaction(async (tx) => {
      // Remover permisos
      if (toRemove.length > 0) {
        await tx.rolePermission.deleteMany({
          where: {
            roleId,
            permissionId: { in: toRemove },
          },
        });
      }

      // Agregar permisos
      if (toAdd.length > 0) {
        await tx.rolePermission.createMany({
          data: toAdd.map((permissionId) => ({
            roleId,
            permissionId,
            grantedBy: userId,
          })),
        });
      }
    });

    return {
      added: toAdd.length,
      removed: toRemove.length,
      total: permissionIds.length,
    };
  }

  /**
   * Validar que un usuario puede gestionar un nivel de rol específico
   */
  private validateCanManageRoleLevel(
    roleLevel: RoleLevel,
    userRoleLevel: RoleLevel,
  ): void {
    // Super admin puede gestionar cualquier rol
    if (userRoleLevel === 'SUPER_ADMIN') {
      return;
    }

    // Estatal puede gestionar ESTATAL y MUNICIPAL
    if (userRoleLevel === 'ESTATAL') {
      if (roleLevel === 'ESTATAL' || roleLevel === 'MUNICIPAL') {
        return;
      }
      throw new ForbiddenException(
        `Usuarios ESTATAL no pueden gestionar roles de nivel ${roleLevel}`,
      );
    }

    // Municipal puede gestionar MUNICIPAL y OPERATIVO
    if (userRoleLevel === 'MUNICIPAL') {
      if (roleLevel === 'MUNICIPAL' || roleLevel === 'OPERATIVO') {
        return;
      }
      throw new ForbiddenException(
        `Usuarios MUNICIPAL no pueden gestionar roles de nivel ${roleLevel}`,
      );
    }

    // Operativo no puede gestionar ningún rol
    throw new ForbiddenException(
      'Usuarios OPERATIVO no pueden gestionar permisos de roles',
    );
  }
}
