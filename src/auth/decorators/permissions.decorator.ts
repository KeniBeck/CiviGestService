import { SetMetadata } from '@nestjs/common';

/**
 * Interfaz para definir una política de permiso
 */
export interface Policy {
  resource: string;
  action: string;
  isSuper?: boolean;
}

export const REQUIRE_POLICIES_KEY = 'require-policies';

/**
 * Decorador para especificar permisos requeridos
 * El usuario debe tener TODOS los permisos especificados
 * Si los permisos no existen en DB, el guard los creará automáticamente
 * 
 * @example
 * @RequirePermissions({ resource: 'fines', action: 'create' })
 * @Post('fines')
 * createFine() {}
 * 
 * @example
 * @RequirePermissions({ resource: 'system', action: 'manage', isSuper: true })
 * @Post('admin/settings')
 * updateSettings() {}
 */
export const RequirePermissions = (...policies: Policy[]) => {
  return SetMetadata(REQUIRE_POLICIES_KEY, policies);
};
