import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class FindDniPermisoDto {
  @ApiProperty({ description: 'Documento del ciudadano', type: String })
  @IsNotEmpty()
  @IsString()
  documentoCiudadano: string;

  @ApiPropertyOptional({ description: 'ID del pago a buscar', type: Number })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  pagoId?: number;

  @ApiPropertyOptional({ description: 'Número de página', type: Number, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Elementos por página', type: Number, default: 10, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
