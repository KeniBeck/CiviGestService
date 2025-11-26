import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO para crear un nuevo tipo de agente
 */
export class CreateTipoAgenteDto {
  @ApiProperty({
    description: 'Nombre del tipo de agente',
    example: 'Agente de Tránsito',
    maxLength: 100,
  })
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  @MaxLength(100, { message: 'El tipo no puede exceder 100 caracteres' })
  tipo: string;
}
