import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO para filtrar tipos de permiso en queries
 */
export class FilterTipoPermisoDto {
  @ApiPropertyOptional({
    description: 'Filtrar solo tipos de permiso activos (true) o inactivos (false)',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Búsqueda en nombre o descripción',
    example: 'construcción',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    example: 10,
    default: 10,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Desactivar paginación (false para obtener todos los registros)',
    type: Boolean,
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  activatePaginated?: boolean;
}
