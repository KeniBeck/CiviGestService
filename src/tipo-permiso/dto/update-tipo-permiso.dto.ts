import { PartialType } from '@nestjs/swagger';
import { CreateTipoPermisoDto } from './create-tipo-permiso.dto';

export class UpdateTipoPermisoDto extends PartialType(CreateTipoPermisoDto) {}
