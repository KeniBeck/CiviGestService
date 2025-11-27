import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO para los parámetros de query de tipos de agente paginados
 */
export class PaginatedTiposAgenteQueryDto {
  @ApiProperty({
    description: 'Número de página',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Número de elementos por página',
    example: 10,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrar por estado activo/inactivo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({
    description: 'Término de búsqueda (busca en tipo)',
    example: 'tránsito',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'search debe ser una cadena de texto' })
  search?: string;

  @ApiProperty({
    description: 'Activar paginación',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'activatePaginated debe ser un valor booleano' })
  @Type(() => Boolean)
  activatePaginated?: boolean = true;
}
