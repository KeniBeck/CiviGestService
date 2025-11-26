import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO para filtrar agentes en queries
 */
export class FilterAgenteDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de tipo de agente',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tipoId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de departamento',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  departamentoId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de patrulla asignada',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  patrullaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar solo agentes activos (true) o inactivos (false)',
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
    description: 'Búsqueda en nombres, apellidos, número de plantilla o correo',
    example: 'juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número de página (por defecto 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Elementos por página (por defecto 10, máximo 100)',
    example: 10,
    minimum: 1,
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
