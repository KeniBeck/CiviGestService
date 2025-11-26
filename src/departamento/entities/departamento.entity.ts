import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Departamento as PrismaDepartamento } from '@prisma/client';

/**
 * Entity para departamento con propiedades para Swagger
 */
export class DepartamentoEntity implements PrismaDepartamento {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sedeId: number;

  @ApiProperty()
  subsedeId: number;

  @ApiProperty()
  nombre: string;

  @ApiPropertyOptional()
  descripcion: string | null;

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
