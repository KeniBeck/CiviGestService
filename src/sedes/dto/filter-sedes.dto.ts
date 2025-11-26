import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterSedesDto {
  @ApiPropertyOptional({
    description: 'Texto para búsqueda por nombre o código de la sede',
    type: String,
    example: 'Jalisco',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar solo sedes activas (true) o inactivas (false)',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Desactivar paginación (false para obtener todos los registros)',
    type: Boolean,
    default: true,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activatePaginated?: boolean;
}
