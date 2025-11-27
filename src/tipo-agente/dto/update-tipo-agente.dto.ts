import { PartialType } from '@nestjs/swagger';
import { CreateTipoAgenteDto } from './create-tipo-agente.dto';

/**
 * DTO para actualizar un tipo de agente
 */
export class UpdateTipoAgenteDto extends PartialType(CreateTipoAgenteDto) {}
