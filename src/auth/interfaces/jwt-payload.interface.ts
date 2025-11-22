import { AccessLevel } from '@prisma/client';

/**
 * JWT Payload Interface
 * Contiene la información del usuario en el token JWT
 * NOTA: Ya NO hay tenantId - Sede es el nivel superior (el departamento/cliente)
 */
export interface JwtPayload {
  sub: number; // User ID
  email: string;
  username: string;
  sedeId: number; // Sede a la que pertenece el usuario (OBLIGATORIO)
  subsedeId: number | null; // Subsede principal (opcional)
  accessLevel: AccessLevel;
  roles: string[]; // Nombres de roles
  permissions: string[]; // permissions en formato "resource:action"
  
  // Accesos explícitos (para evitar consultas repetidas)
  sedeAccessIds: number[]; // IDs de sedes a las que tiene acceso explícito
  subsedeAccessIds: number[]; // IDs de subsedes a las que tiene acceso explícito
}

/**
 * Request User Interface
 * Usuario autenticado adjunto al request
 */
export interface RequestUser extends JwtPayload {
  id: number; // Alias de sub
}
