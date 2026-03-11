import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsEmail,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInfraccionDto {
  @ApiProperty({
    description: 'ID de la multa (catálogo de infracciones)',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  multaId: number;

  @ApiProperty({
    description: 'Folio único de la infracción (autogenerado si no se proporciona)',
    example: 'INF-2024-001234',
  })
  @IsOptional()
  @IsString()
  folio?: string;

  @ApiProperty({
    description: 'Nombre completo del ciudadano infractor',
    example: 'Juan Pérez González',
  })
  @IsString()
  @IsNotEmpty()
  nombreCiudadano: string;

  @ApiProperty({
    description: 'Documento de identificación del ciudadano (CURP, RFC, INE, etc.)',
    example: 'PEGJ850101HDFRZN01',
  })
  @IsString()
  @IsNotEmpty()
  documentoCiudadano: string;

  @ApiPropertyOptional({
    description: 'Domicilio del ciudadano',
    example: 'Av. Principal #123, Col. Centro',
  })
  @IsOptional()
  @IsString()
  domicilioCiudadano?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del ciudadano',
    example: '+52 33 1234 5678',
  })
  @IsOptional()
  @IsString()
  telefonoCiudadano?: string;

  @ApiPropertyOptional({
    description: 'Email del ciudadano',
    example: 'juan.perez@example.com',
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
    example: 'Av. Juárez esquina con Hidalgo',
  })
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Latitud GPS',
    example: 20.6736,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-90)
  latitud?: number;

  @ApiPropertyOptional({
    description: 'Longitud GPS',
    example: -103.3444,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(-180)
  longitud?: number;

  @ApiProperty({
    description: 'Fecha y hora en que ocurrió la infracción (ISO 8601)',
    example: '2024-01-22T10:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaInfraccion: string;

  @ApiPropertyOptional({
    description: 'ID del agente que levantó la infracción',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agenteId?: number;

  @ApiPropertyOptional({
    description: 'Evidencias de la infracción (array JSON)',
    example: [{ tipo: 'foto', url: 'https://...', descripcion: 'Foto del vehículo' }],
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
    description: 'Fecha límite de pago (calculada si no se proporciona)',
    example: '2024-02-22T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  fechaLimitePago?: string;
}
