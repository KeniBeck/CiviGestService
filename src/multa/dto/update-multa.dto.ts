import { PartialType } from '@nestjs/swagger';
import { CreateMultaDto } from './create-multa.dto';

export class UpdateMultaDto extends PartialType(CreateMultaDto) {}
