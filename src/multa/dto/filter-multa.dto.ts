import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsInt, IsPositive } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { IsString } from 'class-validator';

/**
 * DTO para filtrar multas en queries
 */
export class FilterMultaDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de sede',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  sedeId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de subsede',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  subsedeId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de departamento',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  departamentoId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar solo multas activas (true) o inactivas (false)',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Búsqueda en nombre, código o descripción',
    example: 'estacionamiento',
  })
  @IsOptional()
  @IsString()
  search?: string;

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
