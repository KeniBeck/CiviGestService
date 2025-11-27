import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterSubsedesDto {
  @ApiPropertyOptional({
    description: 'ID de la sede (estado) para filtrar subsedes',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sedeId?: number;

  @ApiPropertyOptional({
    description: 'Texto para búsqueda por nombre o código de la subsede',
    type: String,
    example: 'Guadalajara',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar solo subsedes activas (true) o inactivas (false)',
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
