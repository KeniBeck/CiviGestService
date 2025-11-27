import { IsOptional, IsInt, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para filtros de búsqueda de Configuraciones
 */
export class FilterConfiguracionDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Filtrar por ID de tema',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  themeId?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtrar por estado activo/inactivo',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'Guadalajara',
    description: 'Buscar en nombreCliente, ciudad, titular',
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
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Elementos por página',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Activar paginación',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activatePaginated?: boolean;
}
