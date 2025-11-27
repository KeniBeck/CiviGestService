import { PartialType } from '@nestjs/swagger';
import { CreateConfiguracionDto } from './create-configuracion.dto';

export class UpdateConfiguracionDto extends PartialType(CreateConfiguracionDto) {}
