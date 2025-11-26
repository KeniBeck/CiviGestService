import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO para filtrar patrullas
 */
export class FilterPatrullaDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de agente',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'agenteId debe ser un número entero' })
  @Type(() => Number)
  agenteId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo/inactivo',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Término de búsqueda (busca en marca, modelo, placa, numPatrulla, serie)',
    example: 'ford',
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
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede ser mayor a 100' })
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Activar paginación',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'activatePaginated debe ser un valor booleano' })
  @Transform(({ value }) => value === 'true' || value === true)
  activatePaginated?: boolean;
}
