import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard para verificar que el usuario tenga rol SUPER_ADMIN
 * Solo usuarios con nivel SUPER_ADMIN pueden realizar ciertas acciones
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar que el usuario tenga rol SUPER_ADMIN
    const isSuperAdmin = user.roles?.some(
      (role: string) => role === 'Super Administrador',
    );

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Solo Super Administradores pueden realizar esta acción',
      );
    }

    return true;
  }
}
