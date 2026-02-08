import { AccessLevel } from '@prisma/client';

/**
 * JWT Payload Interface
 * Contiene la información del usuario en el token JWT
 * NOTA: Ya NO hay tenantId - Sede es el nivel superior (el departamento/cliente)
 */
export interface JwtPayload {
  sub: number; // User ID o Agente ID
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
  
  // Indicador de tipo de autenticación
  isAgente?: boolean; // true si es un agente de tránsito
}

/**
 * Request User Interface
 * Usuario autenticado adjunto al request
 */
export interface RequestUser extends JwtPayload {
  userId: number; // Alias de sub (ID del usuario o agente)
  isAgente?: boolean; // true si es un agente de tránsito
}
