import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Multa, Prisma } from '@prisma/client';

/**
 * Entity para multa con propiedades para Swagger
 */
export class MultaEntity implements Multa {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sedeId: number;

  @ApiProperty()
  subsedeId: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  codigo: string;

  @ApiPropertyOptional({
    description: 'ID del departamento al que pertenece la multa',
  })
  departamentoId: number | null;

  @ApiPropertyOptional()
  descripcion: string | null;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Costo fijo de la multa en pesos',
  })
  costo: Prisma.Decimal | null;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Número de UMAs',
  })
  numUMAs: Prisma.Decimal | null;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Número de salarios mínimos',
  })
  numSalarios: Prisma.Decimal | null;

  @ApiPropertyOptional({
    type: 'number',
    description: 'Recargo adicional en pesos',
  })
  recargo: Prisma.Decimal | null;

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
}

