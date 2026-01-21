import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleLevel } from '@prisma/client';

export class Role {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Administrador Municipal' })
  name: string;

  @ApiPropertyOptional({
    example: 'Rol para administradores de nivel municipal',
  })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ enum: RoleLevel, example: RoleLevel.MUNICIPAL })
  level: RoleLevel;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la sede (NULL para roles globales)',
  })
  sedeId: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la subsede (NULL para roles globales o de sede)',
  })
  subsedeId: number | null;

  @ApiProperty({
    example: true,
    description: 'true = rol global del sistema, false = rol personalizado',
  })
  isGlobal: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
