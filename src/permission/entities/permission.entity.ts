import { ApiProperty } from '@nestjs/swagger';

export class Permission {
  @ApiProperty({ description: 'ID del permiso' })
  id: number;

  @ApiProperty({ description: 'Recurso del sistema' })
  resource: string;

  @ApiProperty({ description: 'Acción permitida' })
  action: string;

  @ApiProperty({ description: 'Descripción del permiso', required: false })
  description: string | null;

  @ApiProperty({ description: 'Estado activo del permiso' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;
}
