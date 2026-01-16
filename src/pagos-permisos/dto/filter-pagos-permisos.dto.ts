import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsBoolean, 
  IsInt, 
  IsOptional, 
  IsString, 
  IsEnum, 
  IsDateString 
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MetodoPago, EstatusPago } from '@prisma/client';

export class FilterPagosPermisosDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'ID de la sede para filtrar (solo SUPER_ADMIN)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sedeId?: number;

  @ApiPropertyOptional({
    description: 'ID de la subsede para filtrar',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subsedeId?: number;

  @ApiPropertyOptional({
    description: 'ID del permiso para filtrar',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  permisoId?: number;

  @ApiPropertyOptional({
    description: 'Buscar por nombre o documento del ciudadano',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por método de pago',
    enum: MetodoPago,
  })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({
    description: 'Filtrar por estatus del pago',
    enum: EstatusPago,
  })
  @IsOptional()
  @IsEnum(EstatusPago)
  estatus?: EstatusPago;

  @ApiPropertyOptional({
    description: 'Fecha de inicio para rango de búsqueda (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para rango de búsqueda (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que realizó el cobro',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  usuarioCobroId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar solo pagos activos',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar solo reembolsos',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  esReembolso?: boolean;

  @ApiPropertyOptional({
    description: 'Activar paginación',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activatePaginated?: boolean = true;
}
