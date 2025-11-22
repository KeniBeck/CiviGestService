import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsInt,
    MaxLength,
} from 'class-validator';

/**
 * DTO para crear una nueva Subsede (municipio/oficina)
 */
export class CreateSubsedeDto {
    @ApiProperty({
        description: 'ID de la sede a la que pertenece',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    sedeId: number;

    @ApiProperty({
        description: 'Nombre de la subsede/municipio',
        example: 'Municipio de Guadalajara',
        maxLength: 100,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({
        description: 'Código único de la subsede dentro de la sede',
        example: 'GDL',
        maxLength: 20,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    code: string;
}
