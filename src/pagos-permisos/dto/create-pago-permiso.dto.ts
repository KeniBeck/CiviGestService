import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsInt, 
  IsNotEmpty, 
  IsNumber, 
  IsEnum, 
  IsOptional, 
  IsString, 
  IsBoolean,
  Min,
  Max,
  ValidateIf 
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '@prisma/client';

export class CreatePagoPermisoDto {
  @ApiProperty({
    description: 'ID del permiso que se está pagando',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  permisoId: number;

  @ApiProperty({
    description: 'Costo base del permiso',
    example: 1500.00,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  costoBase: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de descuento aplicado (0-100)',
    example: 10,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  descuentoPct?: number;

  @ApiProperty({
    description: 'Método de pago utilizado',
    enum: MetodoPago,
    example: MetodoPago.EFECTIVO,
  })
  @IsEnum(MetodoPago)
  @IsNotEmpty()
  metodoPago: MetodoPago;

  @ApiPropertyOptional({
    description: 'Referencia del pago (para tarjetas/transferencias)',
    example: 'REF-123456789',
  })
  @IsOptional()
  @IsString()
  referenciaPago?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales del pago',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({
    description: '¿El descuento fue autorizado? (requerido si descuentoPct > 0)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @ValidateIf(o => o.descuentoPct > 0)
  @IsNotEmpty({ message: 'Se requiere autorización de descuento' })
  autorizaDescuento?: boolean;

  @ApiPropertyOptional({
    description: 'ID del usuario que autorizó el descuento (requerido si hay descuento)',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ValidateIf(o => o.descuentoPct > 0)
  @IsNotEmpty({ message: 'Se requiere el ID del autorizador' })
  autorizadoPor?: number;

  @ApiPropertyOptional({
    description: 'Firma digital o sello de autorización',
  })
  @IsOptional()
  @IsString()
  firmaAutorizacion?: string;

  @ApiPropertyOptional({
    description: '¿Enviar comprobante por WhatsApp?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enviarWhatsApp?: boolean;

  @ApiPropertyOptional({
    description: '¿Enviar comprobante por Email?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enviarEmail?: boolean;
}
