import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO para los parámetros de query de patrullas paginadas
 */
export class PaginatedPatrullasQueryDto {
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
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede ser mayor a 100' })
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrar por ID de agente',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'agenteId debe ser un número entero' })
  @Type(() => Number)
  agenteId?: number;

  @ApiProperty({
    description: 'Filtrar por estado activo/inactivo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({
    description: 'Término de búsqueda (busca en marca, modelo, placa, numPatrulla, serie)',
    example: 'ford',
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
  @Transform(({ value }) => value === 'true' || value === true)
  activatePaginated?: boolean = true;
}
