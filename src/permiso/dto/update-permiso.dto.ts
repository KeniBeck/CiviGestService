import { PartialType } from '@nestjs/swagger';
import { CreatePermisoDto } from './create-permiso.dto';
import { PermisoEstatus } from '../entities/permiso.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePermisoDto extends PartialType(CreatePermisoDto) {
  @ApiPropertyOptional({ enum: PermisoEstatus })
  @IsOptional()
  @IsEnum(PermisoEstatus)
  estatus?: PermisoEstatus;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Motivo de rechazo' })
  @IsOptional()
  @IsString()
  motivoRechazo?: string;

  @ApiPropertyOptional({ description: 'Fecha de aprobación' })
  @IsOptional()
  fechaAprobacion?: Date;

  @ApiPropertyOptional({ description: 'Fecha de rechazo' })
  @IsOptional()
  fechaRechazo?: Date;
}
