import { TipoAgente } from '@prisma/client';

/**
 * Entidad que representa un tipo de agente en el sistema
 */
export class TipoAgenteEntity implements TipoAgente {
  id: number;
  sedeId: number;
  subsedeId: number;
  tipo: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: number | null;
}
