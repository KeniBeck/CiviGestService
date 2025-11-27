import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { FilterMultaDto } from './filter-multa.dto';

/**
 * DTO para query de paginación de multas
 */
export class PaginatedMultasQueryDto {
  @ApiPropertyOptional({
    description: 'Página actual (por defecto 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página (por defecto 10)',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Activar prefetch de páginas siguientes',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activatePaginated?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filtros para multas',
    type: FilterMultaDto,
  })
  @IsOptional()
  @Type(() => FilterMultaDto)
  filter?: FilterMultaDto;
}
