import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para especificar permisos requeridos
 * El usuario debe tener TODOS los permisos especificados
 * 
 * Formato: "resource:action"
 * 
 * @example
 * @RequirePermissions('fines:create', 'fines:update')
 * @Post('fines')
 * createFine() {}
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
