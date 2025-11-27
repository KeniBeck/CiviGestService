import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  IsInt,
  IsPositive,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para crear una Configuración de Municipio (Cliente)
 * La configuración es única por subsede (relación 1:1)
 */
export class CreateConfiguracionDto {
  @ApiProperty({
    example: 'Municipio de Guadalajara',
    description: 'Nombre del cliente/municipio',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es requerido' })
  @MaxLength(200)
  nombreCliente: string;

  @ApiPropertyOptional({
    example: 'México',
    description: 'País',
    default: 'México',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pais?: string;

  @ApiProperty({
    example: 'Guadalajara',
    description: 'Ciudad',
  })
  @IsString()
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  @MaxLength(100)
  ciudad: string;

  @ApiPropertyOptional({
    example: 'data:image/png;base64,...',
    description: 'Logo del municipio (URL o base64)',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    example: 'Por un Guadalajara más seguro',
    description: 'Slogan del municipio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slogan?: string;

  @ApiPropertyOptional({
    example: 'Lic. Juan Pérez García',
    description: 'Nombre del titular/alcalde',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titular?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del tema visual',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  themeId?: number;

  @ApiProperty({
    example: 248.93,
    description: 'Salario mínimo vigente',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  salarioMinimo: number;

  @ApiProperty({
    example: 108.57,
    description: 'UMA (Unidad de Medida y Actualización) vigente',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  uma: number;

  @ApiPropertyOptional({
    example: 'contacto@guadalajara.gob.mx',
    description: 'Correo de contacto general',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  correoContacto?: string;

  @ApiPropertyOptional({
    example: '+523312345678',
    description: 'WhatsApp de contacto general',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappContacto?: string;

  @ApiPropertyOptional({
    example: '3312345678',
    description: 'Teléfono de contacto general',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telContacto?: string;

  @ApiPropertyOptional({
    example: 'atencion@guadalajara.gob.mx',
    description: 'Correo de atención ciudadana',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  correoAtencion?: string;

  @ApiPropertyOptional({
    example: '+523398765432',
    description: 'WhatsApp de atención ciudadana',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappAtencion?: string;

  @ApiPropertyOptional({
    example: '3398765432',
    description: 'Teléfono de atención ciudadana',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telAtencion?: string;

  @ApiPropertyOptional({
    example: 2.5,
    description: 'Tasa de recargo (%) según SAT',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  tasaRecargo?: number;
}
