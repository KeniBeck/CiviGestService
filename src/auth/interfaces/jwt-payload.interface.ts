import { AccessLevel } from '@prisma/client';

/**
 * JWT Payload Interface
 * Contiene la información del usuario en el token JWT
 */
export interface JwtPayload {
  sub: number; // User ID
  email: string;
  username: string;
  tenantId: number;
  sedeId: number | null;
  subsedeId: number | null;
  accessLevel: AccessLevel;
  roles: string[]; // Nombres de roles
  permissions: string[]; // permissions en formato "resource:action"
}

/**
 * Request User Interface
 * Usuario autenticado adjunto al request
 */
export interface RequestUser extends JwtPayload {
  id: number; // Alias de sub
}
