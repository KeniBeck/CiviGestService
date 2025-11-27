import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO para filtrar tipos de agente
 */
export class FilterTipoAgenteDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado activo/inactivo',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Término de búsqueda (busca en tipo)',
    example: 'tránsito',
  })
  @IsOptional()
  @IsString({ message: 'search debe ser una cadena de texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Activar paginación',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'activatePaginated debe ser un valor booleano' })
  @Type(() => Boolean)
  activatePaginated?: boolean;
}
