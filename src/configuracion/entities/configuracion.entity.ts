import { ApiProperty } from '@nestjs/swagger';
import { Configuracion as PrismaConfiguracion } from '@prisma/client';

/**
 * Entity de Configuracion para Swagger
 * Representa la configuración de un municipio (cliente)
 */
export class ConfiguracionEntity implements PrismaConfiguracion {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1, description: 'ID de la sede (estado)' })
  sedeId: number;

  @ApiProperty({ example: 1, description: 'ID de la subsede (municipio)' })
  subsedeId: number;

  @ApiProperty({ example: 'Municipio de Guadalajara' })
  nombreCliente: string;

  @ApiProperty({ example: 'México' })
  pais: string;

  @ApiProperty({ example: 'Guadalajara' })
  ciudad: string;

  @ApiProperty({ example: 'data:image/png;base64,...', nullable: true })
  logo: string | null;

  @ApiProperty({ example: 'Por un Guadalajara más seguro', nullable: true })
  slogan: string | null;

  @ApiProperty({ example: 'Lic. Juan Pérez García', nullable: true })
  titular: string | null;

  @ApiProperty({ example: 1, nullable: true })
  themeId: number | null;

  @ApiProperty({ example: 248.93, description: 'Salario mínimo' })
  salarioMinimo: any; // Decimal en Prisma

  @ApiProperty({ example: 108.57, description: 'UMA vigente' })
  uma: any; // Decimal en Prisma

  @ApiProperty({ example: 'contacto@guadalajara.gob.mx', nullable: true })
  correoContacto: string | null;

  @ApiProperty({ example: '+523312345678', nullable: true })
  whatsappContacto: string | null;

  @ApiProperty({ example: '3312345678', nullable: true })
  telContacto: string | null;

  @ApiProperty({ example: 'atencion@guadalajara.gob.mx', nullable: true })
  correoAtencion: string | null;

  @ApiProperty({ example: '+523398765432', nullable: true })
  whatsappAtencion: string | null;

  @ApiProperty({ example: '3398765432', nullable: true })
  telAtencion: string | null;

  @ApiProperty({ example: 2.5, description: 'Tasa de recargo (%)' })
  tasaRecargo: any; // Decimal en Prisma

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ example: 1, nullable: true })
  createdBy: number | null;
}
