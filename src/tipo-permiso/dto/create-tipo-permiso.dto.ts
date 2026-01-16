import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  IsInt,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTipoPermisoDto {
  @ApiProperty({
    description: 'Nombre del tipo de permiso',
    example: 'Construcción Menor',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del tipo de permiso',
    example: 'Permiso para construcciones menores a 50m²',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Definición de campos personalizados en formato JSON',
    example: {
      fields: [
        { name: 'superficie', type: 'number', required: true },
        { name: 'ubicacion', type: 'text', required: true },
      ],
    },
  })
  @IsOptional()
  camposPersonalizados?: any;

  @ApiPropertyOptional({
    description: 'Costo base en pesos mexicanos',
    example: 500.0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costoBase?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de UMAs base',
    example: 5.5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  numUMAsBase?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de salarios mínimos base',
    example: 2.0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  numSalariosBase?: number;

  @ApiPropertyOptional({
    description: 'Vigencia por defecto en días',
    example: 365,
    default: 365,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  vigenciaDefecto?: number;
}
