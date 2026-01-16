import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoPermiso } from '@prisma/client';

export class TipoPermisoEntity implements TipoPermiso {
  @ApiProperty({ description: 'ID del tipo de permiso' })
  id: number;

  @ApiProperty({ description: 'ID de la sede (estado)' })
  sedeId: number;

  @ApiProperty({ description: 'ID de la subsede (municipio)' })
  subsedeId: number;

  @ApiProperty({ description: 'Nombre del tipo de permiso' })
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de permiso' })
  descripcion: string | null;

  @ApiPropertyOptional({ description: 'Campos personalizados en formato JSON' })
  camposPersonalizados: any;

  @ApiPropertyOptional({ description: 'Costo base en pesos' })
  costoBase: any;

  @ApiPropertyOptional({ description: 'Cantidad de UMAs base' })
  numUMAsBase: any;

  @ApiPropertyOptional({ description: 'Cantidad de salarios mínimos base' })
  numSalariosBase: any;

  @ApiProperty({ description: 'Vigencia por defecto en días' })
  vigenciaDefecto: number;

  @ApiProperty({ description: 'Estado activo/inactivo' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Fecha de eliminación (soft delete)' })
  deletedAt: Date | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'ID del usuario que creó el registro' })
  createdBy: number | null;
}
