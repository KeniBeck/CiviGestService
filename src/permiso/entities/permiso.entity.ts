import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PermisoEstatus {
  SOLICITADO = 'SOLICITADO',
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  VENCIDO = 'VENCIDO',
  CANCELADO = 'CANCELADO',
}

export class Permiso {
  @ApiProperty()
  id: number;
  @ApiProperty()
  sedeId: number;
  @ApiProperty()
  subsedeId: number;
  @ApiProperty()
  tipoPermisoId: number;
  @ApiProperty()
  folio: string;
  @ApiPropertyOptional()
  descripcion?: string;
  @ApiProperty()
  nombreCiudadano: string;
  @ApiProperty()
  documentoCiudadano: string;
  @ApiPropertyOptional()
  domicilioCiudadano?: string;
  @ApiPropertyOptional()
  telefonoCiudadano?: string;
  @ApiPropertyOptional()
  emailCiudadano?: string;
  @ApiPropertyOptional()
  costo?: number;
  @ApiPropertyOptional()
  numSalarios?: number;
  @ApiPropertyOptional()
  numUMAs?: number;
  @ApiProperty()
  fechaEmision: Date;
  @ApiProperty()
  fechaVencimiento: Date;
  @ApiProperty()
  vigenciaDias: number;
  @ApiPropertyOptional()
  qr?: string;
  @ApiProperty({ enum: PermisoEstatus })
  estatus: PermisoEstatus;
  @ApiPropertyOptional()
  documentosAdjuntos?: any;
  @ApiPropertyOptional()
  camposAdicionales?: any;
  @ApiProperty()
  fechaSolicitud: Date;
  @ApiPropertyOptional()
  fechaAprobacion?: Date;
  @ApiPropertyOptional()
  fechaRechazo?: Date;
  @ApiPropertyOptional()
  observaciones?: string;
  @ApiPropertyOptional()
  motivoRechazo?: string;
  @ApiProperty()
  isActive: boolean;
  @ApiPropertyOptional()
  deletedAt?: Date;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiPropertyOptional()
  createdBy?: number;
}
