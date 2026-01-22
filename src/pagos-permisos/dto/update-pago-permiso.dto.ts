import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstatusPago } from '@prisma/client';

export class UpdatePagoPermisoDto {
  @ApiPropertyOptional({
    description: 'Actualizar estatus del pago',
    enum: EstatusPago,
  })
  @IsOptional()
  @IsEnum(EstatusPago)
  estatus?: EstatusPago;

  @ApiPropertyOptional({
    description: 'Actualizar observaciones del pago',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Actualizar referencia de pago',
    example: 'REF-123456-CORREGIDA',
  })
  @IsOptional()
  @IsString()
  referenciaPago?: string;
}
