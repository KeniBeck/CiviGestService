import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sede as PrismaSede } from '@prisma/client';

/**
 * SedeEntity - Representa una Sede (Departamento/Cliente)
 * 
 * Una Sede es el nivel superior en CiviGest:
 * - Es el departamento o cliente que contrata el servicio
 * - Puede tener múltiples Subsedes (municipios/oficinas)
 * - Solo los Super Admins pueden crear/eliminar Sedes
 */
export class SedeEntity implements PrismaSede {
  @ApiProperty({ description: 'ID único de la sede' })
  id: number;

  @ApiProperty({ description: 'Nombre de la sede (departamento)', example: 'Secretaría de Seguridad Pública CDMX' })
  name: string;

  @ApiProperty({ description: 'Código único de la sede', example: 'SSP-CDMX' })
  code: string;

  @ApiPropertyOptional({ description: 'NIT o RFC de la institución', example: 'SSP123456ABC' })
  nit: string | null;

  @ApiPropertyOptional({ description: 'Razón social o nombre legal' })
  legalName: string | null;

  @ApiProperty({ description: 'Email de contacto principal', example: 'contacto@ssp.cdmx.gob.mx' })
  email: string;

  @ApiProperty({ description: 'Código de país del teléfono', example: '+52', default: '+52' })
  phoneCountryCode: string;

  @ApiProperty({ description: 'Número de teléfono', example: '5555551234' })
  phoneNumber: string;

  @ApiProperty({ description: 'Dirección física de la sede', example: 'Av. Insurgentes Sur 1234' })
  address: string;

  @ApiProperty({ description: 'Ciudad', example: 'Ciudad de México' })
  city: string;

  @ApiProperty({ description: 'Estado', example: 'CDMX' })
  state: string;

  @ApiPropertyOptional({ description: 'Código postal', example: '01000' })
  postalCode: string | null;

  @ApiPropertyOptional({ description: 'Sitio web oficial', example: 'https://ssp.cdmx.gob.mx' })
  website: string | null;

  @ApiPropertyOptional({ description: 'Latitud de la sede', type: 'string' })
  latitude: any | null;

  @ApiPropertyOptional({ description: 'Longitud de la sede', type: 'string' })
  longitude: any | null;

  @ApiPropertyOptional({ description: 'URL del logo de la sede' })
  logo: string | null;

  @ApiPropertyOptional({ description: 'URL del favicon de la sede' })
  favicon: string | null;

  @ApiPropertyOptional({ description: 'ID del tema activo' })
  themeId: number | null;

  @ApiProperty({ description: 'Indica si la sede está activa' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Fecha de eliminación (soft delete)' })
  deletedAt: Date | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'ID del usuario que creó la sede (Super Admin)' })
  createdBy: number | null;
}
