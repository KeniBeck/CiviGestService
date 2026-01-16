import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RoleLevel } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Administrador Municipal',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del rol',
    example: 'Rol para administradores de nivel municipal',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Nivel del rol',
    enum: RoleLevel,
    example: RoleLevel.MUNICIPAL,
  })
  @IsEnum(RoleLevel)
  @IsNotEmpty()
  level: RoleLevel;

  @ApiPropertyOptional({
    description: 'Estado del rol',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
