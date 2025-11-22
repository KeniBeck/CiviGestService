import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';

/**
 * DTO simplificado para crear subsedes al momento de crear una sede
 */
export class CreateSubsedeInSedeDto {
  @ApiProperty({
    description: 'Nombre de la subsede/municipio',
    example: 'Municipio de Guadalajara',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Código único de la subsede',
    example: 'GDL',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional({
    description: 'Dirección física de la subsede',
    example: 'Av. Hidalgo 400, Centro',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto de la subsede',
    example: 'guadalajara@sede.gob.mx',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '3312345678',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;
}
