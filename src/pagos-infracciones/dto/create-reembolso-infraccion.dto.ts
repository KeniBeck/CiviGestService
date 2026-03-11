import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReembolsoInfraccionDto {
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
    example: 'Solicitud del ciudadano por error en el levantamiento',
  })
  @IsOptional()
  @IsString()
  motivoReembolso?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  autorizadoPor?: number;
}
