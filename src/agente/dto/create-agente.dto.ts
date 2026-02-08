import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  IsPositive,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para crear un agente
 */
export class CreateAgenteDto {
  @ApiProperty({
    description: 'Nombres del agente',
    example: 'Juan Carlos',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({
    description: 'Apellido paterno del agente',
    example: 'García',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidoPaterno: string;

  @ApiProperty({
    description: 'Apellido materno del agente',
    example: 'López',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidoMaterno: string;

  @ApiProperty({
    description: 'ID del tipo de agente',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  tipoId: number;

  @ApiProperty({
    description: 'Cargo del agente',
    example: 'Oficial de Tránsito',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cargo: string;

  @ApiProperty({
    description: 'Número de plantilla (único por municipio)',
    example: 'PLT-001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numPlaca: string;

  @ApiPropertyOptional({
    description: 'Número de empleado biométrico',
    example: 'BIO-12345',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numEmpleadoBiometrico?: string;

  @ApiPropertyOptional({
    description: 'Foto del agente (base64 o URL)',
    example: 'data:image/jpeg;base64,...',
  })
  @IsOptional()
  @IsString()
  foto?: string;

  @ApiPropertyOptional({
    description: 'Número de WhatsApp',
    example: '+5215512345678',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @ApiProperty({
    description: 'Correo electrónico del agente (OBLIGATORIO)',
    example: 'juan.garcia@municipio.gob.mx',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  correo: string;

  @ApiPropertyOptional({
    description: 'Contraseña del agente (opcional, si no se proporciona se usará el numPlaca)',
    example: 'Password123!',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contrasena?: string;

  @ApiPropertyOptional({
    description: 'ID del departamento al que pertenece',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  departamentoId?: number;

  @ApiPropertyOptional({
    description: 'ID de la patrulla asignada',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  patrullaId?: number;
}
