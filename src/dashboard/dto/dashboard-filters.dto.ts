import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardFiltersDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio para filtrar métricas (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para filtrar métricas (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'ID de la sede para filtrar (solo Super Admin)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sedeId?: number;

  @ApiPropertyOptional({
    description: 'ID de la subsede para filtrar (Admin Estatal)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subsedeId?: number;
}
