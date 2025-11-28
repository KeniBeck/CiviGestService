import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, IsNotEmpty, MaxLength, IsOptional, IsEmail, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePermisoDto {
  @ApiProperty({ description: 'ID del tipo de permiso', type: Number })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  tipoPermisoId: number;

  @ApiProperty({ description: 'Nombre del ciudadano', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreCiudadano: string;

  @ApiProperty({ description: 'Documento del ciudadano', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentoCiudadano: string;

  @ApiPropertyOptional({ description: 'Domicilio del ciudadano', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domicilioCiudadano?: string;

  @ApiPropertyOptional({ description: 'Teléfono del ciudadano', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefonoCiudadano?: string;

  @ApiPropertyOptional({ description: 'Email del ciudadano', maxLength: 100 })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  emailCiudadano?: string;

  @ApiProperty({ description: 'Fecha de emisión', type: Date })
  @IsDate()
  @Type(() => Date)
  fechaEmision: Date;

  @ApiPropertyOptional({ description: 'Vigencia en días', type: Number })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  vigenciaDias?: number;

  @ApiPropertyOptional({ description: 'Campos adicionales personalizados', type: Object, additionalProperties: true })
  @IsOptional()
  camposAdicionales?: any;

  @ApiPropertyOptional({ description: 'Documentos adjuntos', type: Object, additionalProperties: true })
  @IsOptional()
  documentosAdjuntos?: any;

  @ApiPropertyOptional({ description: 'Descripción del permiso' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
