import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InfraccionEstatus } from '@prisma/client';

export class UpdateInfraccionDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del ciudadano infractor',
  })
  @IsOptional()
  @IsString()
  nombreCiudadano?: string;

  @ApiPropertyOptional({
    description: 'Documento de identificación del ciudadano',
  })
  @IsOptional()
  @IsString()
  documentoCiudadano?: string;

  @ApiPropertyOptional({
    description: 'Domicilio del ciudadano',
  })
  @IsOptional()
  @IsString()
  domicilioCiudadano?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del ciudadano',
  })
  @IsOptional()
  @IsString()
  telefonoCiudadano?: string;

  @ApiPropertyOptional({
    description: 'Email del ciudadano',
  })
  @IsOptional()
  @IsEmail()
  emailCiudadano?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de los hechos',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Ubicación donde ocurrió la infracción',
  })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Latitud GPS',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-90)
  latitud?: number;

  @ApiPropertyOptional({
    description: 'Longitud GPS',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-180)
  longitud?: number;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que ocurrió la infracción',
  })
  @IsOptional()
  @IsDateString()
  fechaInfraccion?: string;

  @ApiPropertyOptional({
    description: 'Estado de la infracción',
    enum: InfraccionEstatus,
  })
  @IsOptional()
  @IsEnum(InfraccionEstatus)
  estatus?: InfraccionEstatus;

  @ApiPropertyOptional({
    description: 'Evidencias de la infracción (array JSON)',
  })
  @IsOptional()
  evidencias?: any;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Fecha límite de pago',
  })
  @IsOptional()
  @IsDateString()
  fechaLimitePago?: string;
}
