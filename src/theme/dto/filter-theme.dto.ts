import {
  IsOptional,
  IsBoolean,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para filtros de búsqueda de temas
 */
export class FilterThemeDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Filtrar por modo oscuro',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  darkMode?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtrar por tema por defecto',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 'azul',
    description: 'Buscar en nombre y descripción del tema',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Número de página',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Elementos por página (máximo 100)',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Activar paginación',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  activatePaginated?: boolean;
}
