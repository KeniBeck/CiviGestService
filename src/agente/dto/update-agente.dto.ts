import { PartialType } from '@nestjs/swagger';
import { CreateAgenteDto } from './create-agente.dto';

export class UpdateAgenteDto extends PartialType(CreateAgenteDto) {}
