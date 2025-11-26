import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginatedSubsedesQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página (comenzando desde 1)',
    type: Number,
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    type: Number,
    minimum: 1,
    maximum: 50,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'ID de la sede (estado) para filtrar subsedes',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sedeId?: number;

  @ApiPropertyOptional({
    description: 'Texto para búsqueda por nombre o código de la subsede',
    type: String,
    example: 'Guadalajara',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar solo subsedes activas (true) o inactivas (false)',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
