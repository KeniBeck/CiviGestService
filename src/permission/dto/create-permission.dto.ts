import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Recurso del sistema (ej: multas, permisos, agentes)',
    example: 'multas',
  })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({
    description: 'Acción permitida (ej: create, read, update, delete, approve)',
    example: 'create',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({
    description: 'Descripción del permiso',
    example: 'Crear nuevas multas en el sistema',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Estado activo del permiso',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

