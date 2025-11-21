import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsDecimal,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSedeDto {
  @ApiProperty({
    example: 'Jalisco',
    description: 'Nombre de la sede (Estado)',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'JAL',
    description: 'Código único de la sede',
  })
  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  @MaxLength(20)
  @MinLength(2)
  code: string;

  @ApiPropertyOptional({
    example: 'JAL123456ABC',
    description: 'NIT o RFC de la institución',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  nit?: string;

  @ApiPropertyOptional({
    example: 'Secretaría de Seguridad Pública del Estado de Jalisco',
    description: 'Razón social o nombre legal',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  legalName?: string;

  @ApiProperty({
    example: 'contacto@jalisco.gob.mx',
    description: 'Email de contacto (requerido)',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    example: '+52',
    description: 'Código de país del teléfono',
    default: '+52',
  })
  @IsString()
  @IsNotEmpty()
  phoneCountryCode: string;

  @ApiProperty({
    example: '3312345678',
    description: 'Número de teléfono',
  })
  @IsString()
  @IsNotEmpty({ message: 'El número de teléfono es requerido' })
  phoneNumber: string;

  @ApiProperty({
    example: 'Av. Prolongación Alcalde 1351',
    description: 'Dirección de la sede',
  })
  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @MaxLength(255)
  address: string;

  @ApiProperty({
    example: 'Guadalajara',
    description: 'Ciudad',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    example: 'Jalisco',
    description: 'Estado de México',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @ApiPropertyOptional({
    example: '44100',
    description: 'Código postal',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  postalCode?: string;

  @ApiPropertyOptional({
    example: 'https://jalisco.gob.mx',
    description: 'Sitio web oficial',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    example: '20.6737777',
    description: 'Latitud de la sede',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,8' })
  latitude?: string;

  @ApiPropertyOptional({
    example: '-103.3444444',
    description: 'Longitud de la sede',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '1,8' })
  longitude?: string;
}
