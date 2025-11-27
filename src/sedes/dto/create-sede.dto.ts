import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateSubsedeDto } from '../../sudsedes/dto/create-sudsede.dto';

/**
 * DTO para crear subsedes al momento de crear una sede
 * Omite el sedeId porque se asigna automáticamente
 */
export class CreateSubsedeInSedeDto extends OmitType(CreateSubsedeDto, [
  'sedeId',
] as const) {}

/**
 * DTO para crear una Sede (Estado)
 * Simplificado: Solo name y code (la configuración del cliente va en el recurso Configuracion)
 */
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
    description: 'Lista de subsedes a crear junto con la sede',
    type: [CreateSubsedeInSedeDto],
    example: [
      {
        name: 'Municipio de Guadalajara',
        code: 'GDL'
      },
      {
        name: 'Municipio de Zapopan',
        code: 'ZPN'
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubsedeInSedeDto)
  subsedes?: CreateSubsedeInSedeDto[];
}
