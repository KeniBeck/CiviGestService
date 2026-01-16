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
    description: 'Actualizar observaciones',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
