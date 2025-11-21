import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, AccessLevel } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'admin@civigest.com',
    description: 'Email del usuario',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @ApiProperty({
    example: 'admin.user',
    description: 'Nombre de usuario único',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username es requerido' })
  @MinLength(4, { message: 'El username debe tener al menos 4 caracteres' })
  username: string;

  @ApiProperty({
    example: 'Admin123!',
    description: 'Contraseña del usuario (mínimo 8 caracteres, mayúscula, minúscula, número)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
    },
  )
  password: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nombre es requerido' })
  firstName: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'Apellido es requerido' })
  lastName: string;

  @ApiProperty({
    example: '+52',
    description: 'Código de país del teléfono',
  })
  @IsString()
  @IsNotEmpty()
  phoneCountryCode: string;

  @ApiProperty({
    example: '5512345678',
    description: 'Número de teléfono',
  })
  @IsString()
  @IsNotEmpty({ message: 'Número de teléfono es requerido' })
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'Av. Insurgentes Sur 1234',
    description: 'Dirección del usuario',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CURP,
    description: 'Tipo de documento',
  })
  @IsEnum(DocumentType, { message: 'Tipo de documento inválido' })
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiProperty({
    example: 'PERJ850101HDFRNN09',
    description: 'Número de documento',
  })
  @IsString()
  @IsNotEmpty({ message: 'Número de documento es requerido' })
  documentNumber: string;

  @ApiProperty({
    example: 1,
    description: 'ID del tenant al que pertenece el usuario',
  })
  @IsInt()
  @IsNotEmpty({ message: 'Tenant ID es requerido' })
  tenantId: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la sede principal del usuario',
  })
  @IsInt()
  @IsOptional()
  sedeId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la subsede principal del usuario',
  })
  @IsInt()
  @IsOptional()
  subsedeId?: number;

  @ApiProperty({
    enum: AccessLevel,
    example: AccessLevel.SUBSEDE,
    description: 'Nivel de acceso del usuario',
  })
  @IsEnum(AccessLevel)
  @IsNotEmpty()
  accessLevel: AccessLevel;
}
