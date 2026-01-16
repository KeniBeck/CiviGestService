import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReembolsoDto {
  @ApiProperty({
    description: 'ID del pago original a reembolsar',
    example: 15,
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  pagoOriginalId: number;

  @ApiPropertyOptional({
    description: 'Motivo del reembolso',
    example: 'Solicitud del ciudadano por cancelación del trámite',
  })
  @IsOptional()
  @IsString()
  motivoReembolso?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que autoriza el reembolso',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  autorizadoPor?: number;
}
