import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para especificar roles requeridos
 * El usuario debe tener AL MENOS UNO de los roles especificados
 * 
 * @example
 * @Roles('Super Administrador', 'Administrador Estatal')
 * @Get('admin-only')
 * adminEndpoint() {}
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
