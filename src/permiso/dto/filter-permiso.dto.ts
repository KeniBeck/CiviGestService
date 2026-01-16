import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsPositive, IsString, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PermisoEstatus } from '../entities/permiso.entity';

export class FilterPermisoDto {
  @ApiPropertyOptional({ description: 'Filtrar por tipoPermisoId', type: Number })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  tipoPermisoId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por estatus', enum: PermisoEstatus })
  @IsOptional()
  @IsEnum(PermisoEstatus)
  estatus?: PermisoEstatus;

  @ApiPropertyOptional({ description: 'Filtrar por documentoCiudadano', type: String })
  @IsOptional()
  @IsString()
  documentoCiudadano?: string;

  @ApiPropertyOptional({ description: 'Filtrar desde fechaEmision', type: Date })
  @IsOptional()
  @Type(() => Date)
  fechaDesde?: Date;

  @ApiPropertyOptional({ description: 'Filtrar hasta fechaEmision', type: Date })
  @IsOptional()
  @Type(() => Date)
  fechaHasta?: Date;

  @ApiPropertyOptional({ description: 'Filtrar solo permisos activos (true) o inactivos (false)', type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Búsqueda en nombreCiudadano, folio, documentoCiudadano', type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Número de página', type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Elementos por página', type: Number, default: 10, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
