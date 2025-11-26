import { Patrulla } from '@prisma/client';

/**
 * Entidad que representa una patrulla en el sistema
 */
export class PatrullaEntity implements Patrulla {
  id: number;
  sedeId: number;
  subsedeId: number;
  agenteId: number;
  marca: string;
  modelo: string;
  placa: string;
  numPatrulla: string;
  serie: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: number | null;
}
