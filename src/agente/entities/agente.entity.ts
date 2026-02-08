import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Agente } from '@prisma/client';

/**
 * Entity para agente con propiedades para Swagger
 */
export class AgenteEntity implements Agente {
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  lastLoginAt: Date | null;
  @ApiProperty()
  id: number;

  @ApiProperty()
  sedeId: number;

  @ApiProperty()
  subsedeId: number;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidoPaterno: string;

  @ApiProperty()
  apellidoMaterno: string;

  @ApiProperty()
  tipoId: number;

  @ApiProperty()
  cargo: string;

  @ApiProperty()
  numPlaca: string;

  @ApiPropertyOptional()
  numEmpleadoBiometrico: string | null;

  @ApiPropertyOptional()
  foto: string | null;

  @ApiPropertyOptional()
  whatsapp: string | null;

  @ApiPropertyOptional()
  correo: string;

  @ApiPropertyOptional()
  contrasena: string;

  @ApiPropertyOptional()
  departamentoId: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  deletedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy: number | null;

  @ApiPropertyOptional()
  patrullaId: number;
}
