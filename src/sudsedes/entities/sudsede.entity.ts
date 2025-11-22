import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Subsede } from '@prisma/client';

/**
 * Entity para Subsede (Municipio/Oficina)
 */
export class SubsedeEntity implements Subsede {
  @ApiProperty({ description: 'ID único de la subsede' })
  id: number;

  @ApiProperty({ description: 'ID de la sede padre' })
  sedeId: number;

  @ApiProperty({ description: 'Nombre de la subsede/municipio' })
  name: string;

  @ApiProperty({ description: 'Código único dentro de la sede' })
  code: string;

  @ApiPropertyOptional({ description: 'Email de contacto' })
  email: string | null;

  @ApiProperty({ description: 'Código de país del teléfono' })
  phoneCountryCode: string;

  @ApiPropertyOptional({ description: 'Número de teléfono' })
  phoneNumber: string | null;

  @ApiProperty({ description: 'Dirección física' })
  address: string;

  @ApiPropertyOptional({ description: 'Latitud' })
  latitude: any;

  @ApiPropertyOptional({ description: 'Longitud' })
  longitude: any;

  @ApiPropertyOptional({ description: 'Población del municipio' })
  population: number | null;

  @ApiPropertyOptional({ description: 'Código INEGI' })
  municipalityCode: string | null;

  @ApiProperty({ description: 'Estado activo/inactivo' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Fecha de eliminación (soft delete)' })
  deletedAt: Date | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'ID del usuario que creó la subsede' })
  createdBy: number | null;
}
