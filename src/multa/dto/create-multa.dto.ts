import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  ValidateIf,
  IsInt,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMultaDto {
  @ApiProperty({
    description: 'Nombre de la multa',
    example: 'Estacionarse en lugar prohibido',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @ApiProperty({
    description: 'Código único de la multa dentro del municipio',
    example: 'TR-001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({
    description: 'ID del departamento al que pertenece la multa',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  departamentoId: number;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la multa',
    example: 'Multa aplicada cuando un vehículo se estaciona en zona prohibida',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Monto fijo de la multa en pesos mexicanos',
    example: 500.00,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ValidateIf((o) => o.costo !== undefined || (!o.numUMAs && !o.numSalarios))
  costo?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de UMAs (Unidades de Medida y Actualización)',
    example: 5.5,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ValidateIf((o) => o.numUMAs !== undefined || (!o.costo && !o.numSalarios))
  numUMAs?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de salarios mínimos',
    example: 2.0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ValidateIf((o) => o.numSalarios !== undefined || (!o.costo && !o.numUMAs))
  numSalarios?: number;

  @ApiPropertyOptional({
    description: 'Recargo adicional en pesos si aplica',
    example: 100.00,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  recargo?: number;
}