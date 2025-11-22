import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSubsedeDto } from './create-sudsede.dto';

/**
 * DTO para actualizar una Subsede
 * Omite sedeId porque no se debe cambiar la sede padre
 */
export class UpdateSubsedeDto extends PartialType(
  OmitType(CreateSubsedeDto, ['sedeId'] as const),
) {}
