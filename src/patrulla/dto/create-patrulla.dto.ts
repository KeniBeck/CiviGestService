import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO para crear una nueva patrulla
 */
export class CreatePatrullaDto {
  @ApiProperty({
    description: 'Marca de la patrulla',
    example: 'Ford',
    maxLength: 50,
  })
  @IsString({ message: 'marca debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'marca es obligatorio' })
  @MaxLength(50, { message: 'marca no puede exceder 50 caracteres' })
  marca: string;

  @ApiProperty({
    description: 'Modelo de la patrulla',
    example: 'Explorer 2023',
    maxLength: 50,
  })
  @IsString({ message: 'modelo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'modelo es obligatorio' })
  @MaxLength(50, { message: 'modelo no puede exceder 50 caracteres' })
  modelo: string;

  @ApiProperty({
    description: 'Placa vehicular (única globalmente)',
    example: 'ABC-123-XYZ',
    maxLength: 20,
  })
  @IsString({ message: 'placa debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'placa es obligatorio' })
  @MaxLength(20, { message: 'placa no puede exceder 20 caracteres' })
  placa: string;

  @ApiProperty({
    description: 'Número de patrulla (único por municipio)',
    example: 'P-001',
    maxLength: 50,
  })
  @IsString({ message: 'numPatrulla debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'numPatrulla es obligatorio' })
  @MaxLength(50, { message: 'numPatrulla no puede exceder 50 caracteres' })
  numPatrulla: string;

  @ApiPropertyOptional({
    description: 'Número de serie del vehículo',
    example: '1HGBH41JXMN109186',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'serie debe ser una cadena de texto' })
  @MaxLength(100, { message: 'serie no puede exceder 100 caracteres' })
  serie?: string;
}
