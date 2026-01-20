import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../interfaces/jwt-payload.interface';
import { Policy, REQUIRE_POLICIES_KEY } from '../decorators/permissions.decorator';

/**
 * Permissions Guard
 * Valida que el usuario tenga todos los permisos requeridos
 * Si los permisos no existen en DB, los crea automáticamente
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener políticas requeridas del decorador @RequirePermissions()
    const requiredPolicies = this.reflector.getAllAndOverride<Policy[]>(
      REQUIRE_POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPolicies || requiredPolicies.length === 0) {
      return true; // No hay permisos requeridos
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Asegurar que los permisos existen en DB (los crea si no existen)
    await this.ensurePermissionsExist(requiredPolicies);

    // Verificar si el usuario tiene TODOS los permisos requeridos
    for (const policy of requiredPolicies) {
      const permissionString = `${policy.resource}:${policy.action}`;
      
      // Si es un permiso de super admin, verificar que el usuario sea super admin
      if (policy.isSuper && !user.roles.includes('Super Administrador')) {
        throw new ForbiddenException(
          `Acceso denegado. Se requiere rol de Super Administrador`,
        );
      }

      // Verificar que el usuario tenga el permiso
      if (!user.permissions.includes(permissionString)) {
        throw new ForbiddenException(
          `Acceso denegado. Se requiere el permiso: ${permissionString}`,
        );
      }
    }

    return true;
  }

  /**
   * Asegura que los permisos existan en la base de datos
   * Si no existen, los crea automáticamente y los asigna a los roles administrativos
   * (Super Administrador, Administrador Estatal, Administrador Municipal)
   */
  private async ensurePermissionsExist(policies: Policy[]): Promise<void> {
    // Obtener los roles administrativos
    const adminRoles = await this.prisma.role.findMany({
      where: {
        name: {
          in: [
            'Super Administrador',
            'Administrador Estatal',
            'Administrador Municipal',
          ],
        },
        isActive: true,
      },
    });

    if (adminRoles.length === 0) {
      // Si no existen los roles administrativos, solo crear los permisos
      for (const policy of policies) {
        await this.createPermissionIfNotExists(policy);
      }
      return;
    }

    for (const policy of policies) {
      const permission = await this.createPermissionIfNotExists(policy);
      
      // Asignar el permiso a todos los roles administrativos si no está asignado
      if (permission) {
        for (const role of adminRoles) {
          await this.assignPermissionToRole(permission.id, role.id);
        }
      }
    }
  }

  /**
   * Crea un permiso si no existe
   * Retorna el permiso (existente o recién creado)
   */
  private async createPermissionIfNotExists(policy: Policy) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: policy.resource,
          action: policy.action,
        },
      },
    });

    if (existingPermission) {
      return existingPermission;
    }

    // Crear el permiso
    return await this.prisma.permission.create({
      data: {
        resource: policy.resource,
        action: policy.action,
        description: `${policy.resource}:${policy.action}`,
        isActive: true,
      },
    });
  }

  /**
   * Asigna un permiso a un rol si no está asignado
   */
  private async assignPermissionToRole(
    permissionId: number,
    roleId: number,
  ): Promise<void> {
    const existingAssignment = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!existingAssignment) {
      await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
          grantedBy: 0, // Sistema
        },
      });
    }
  }
}
