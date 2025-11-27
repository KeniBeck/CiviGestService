import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo tema visual
 */
export class CreateThemeDto {
  @ApiProperty({
    example: 'Tema Azul Moderno',
    description: 'Nombre del tema',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    example: 'Tema con colores azules y diseño moderno',
    description: 'Descripción del tema',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    example: '#1976D2',
    description: 'Color primario (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'primaryColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  primaryColor: string;

  @ApiProperty({
    example: '#424242',
    description: 'Color secundario (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'secondaryColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  secondaryColor: string;

  @ApiProperty({
    example: '#FF5722',
    description: 'Color de acento (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'accentColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  accentColor: string;

  @ApiProperty({
    example: '#FAFAFA',
    description: 'Color de fondo (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'backgroundColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  backgroundColor: string;

  @ApiProperty({
    example: '#FFFFFF',
    description: 'Color de superficie (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'surfaceColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  surfaceColor: string;

  @ApiProperty({
    example: '#212121',
    description: 'Color de texto primario (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'textPrimaryColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  textPrimaryColor: string;

  @ApiProperty({
    example: '#757575',
    description: 'Color de texto secundario (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'textSecondaryColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  textSecondaryColor: string;

  @ApiProperty({
    example: '#4CAF50',
    description: 'Color de éxito (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'successColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  successColor: string;

  @ApiProperty({
    example: '#FF9800',
    description: 'Color de advertencia (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'warningColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  warningColor: string;

  @ApiProperty({
    example: '#F44336',
    description: 'Color de error (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'errorColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  errorColor: string;

  @ApiProperty({
    example: '#2196F3',
    description: 'Color de información (formato hexadecimal #RRGGBB)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'infoColor debe ser un color hexadecimal válido (ej: #FF5733)',
  })
  infoColor: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Modo oscuro activado',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Tema por defecto del sistema',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
