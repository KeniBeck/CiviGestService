import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { DocumentType, AccessLevel } from '@prisma/client';

/**
 * DTO para crear un nuevo usuario
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@civigest.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Username único',
    example: 'juanperez',
    minLength: 4,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Nombre(s)',
    example: 'Juan',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Apellido(s)',
    example: 'Pérez García',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Código de país del teléfono',
    example: '+52',
    default: '+52',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5)
  phoneCountryCode?: string;

  @ApiProperty({
    description: 'Número de teléfono',
    example: '3312345678',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Dirección del usuario',
    example: 'Av. Hidalgo 400',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: DocumentType.CURP,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiProperty({
    description: 'Número de documento',
    example: 'PEPJ850101HJCRRS01',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentNumber: string;

  @ApiProperty({
    description: 'Nivel de acceso del usuario',
    enum: AccessLevel,
    example: AccessLevel.SUBSEDE,
  })
  @IsEnum(AccessLevel)
  @IsNotEmpty()
  accessLevel: AccessLevel;

  @ApiProperty({
    description: 'ID de la sede a la que pertenece el usuario',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  sedeId: number;

  @ApiPropertyOptional({
    description: 'ID de la subsede a la que pertenece el usuario (opcional)',
    example: 5,
  })
  @IsInt()
  @IsOptional()
  subsedeId?: number;

  @ApiProperty({
    description: 'IDs de los roles a asignar al usuario',
    example: [2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  roleIds: number[];

  @ApiPropertyOptional({
    description: 'IDs de subsedes con acceso explícito (solo para usuarios ESTATAL)',
    example: [5, 6, 7],
    type: [Number],
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  subsedeAccessIds?: number[];
}
