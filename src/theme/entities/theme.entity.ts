import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Theme as PrismaTheme } from '@prisma/client';

/**
 * Entity de Theme para Swagger
 * Representa un tema visual del sistema
 */
export class ThemeEntity implements PrismaTheme {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Tema Azul Moderno' })
  name: string;

  @ApiPropertyOptional({ example: 'Tema con colores azules y diseño moderno' })
  description: string | null;

  @ApiProperty({ example: '#1976D2' })
  primaryColor: string;

  @ApiProperty({ example: '#424242' })
  secondaryColor: string;

  @ApiProperty({ example: '#FF5722' })
  accentColor: string;

  @ApiProperty({ example: '#FAFAFA' })
  backgroundColor: string;

  @ApiProperty({ example: '#FFFFFF' })
  surfaceColor: string;

  @ApiProperty({ example: '#212121' })
  textPrimaryColor: string;

  @ApiProperty({ example: '#757575' })
  textSecondaryColor: string;

  @ApiProperty({ example: '#4CAF50' })
  successColor: string;

  @ApiProperty({ example: '#FF9800' })
  warningColor: string;

  @ApiProperty({ example: '#F44336' })
  errorColor: string;

  @ApiProperty({ example: '#2196F3' })
  infoColor: string;

  @ApiProperty({ example: false })
  darkMode: boolean;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
