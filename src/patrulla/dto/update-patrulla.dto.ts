import { PartialType } from '@nestjs/swagger';
import { CreatePatrullaDto } from './create-patrulla.dto';

/**
 * DTO para actualizar una patrulla
 */
export class UpdatePatrullaDto extends PartialType(CreatePatrullaDto) {}
