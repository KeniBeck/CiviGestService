import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO para actualizar usuario
 * Omite password y sedeId (no se pueden cambiar en update)
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
