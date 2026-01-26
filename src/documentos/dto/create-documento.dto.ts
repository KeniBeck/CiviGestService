import { IsString, IsOptional, IsInt, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentoDto {
  @ApiProperty({ description: 'ID de la sede (departamento)', example: 1 })
  @IsInt()
  @IsNotEmpty()
  sedeId: number;

  @ApiProperty({ description: 'ID de la subsede (municipio)', example: 1 })
  @IsInt()
  @IsNotEmpty()
  subsedeId: number;

  @ApiProperty({ description: 'Título del documento', example: 'Plano de construcción' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo: string;

  @ApiPropertyOptional({ description: 'Descripción del documento', example: 'Plano arquitectónico del proyecto' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Tipo de documento', example: 'plano' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tipo?: string;

  @ApiPropertyOptional({ description: 'Entidad relacionada', example: 'permiso' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  entidadRelacionada?: string;

  @ApiPropertyOptional({ description: 'ID de la entidad relacionada', example: 123 })
  @IsInt()
  @IsOptional()
  entidadId?: number;
}
