import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginAgenteDto {
  @ApiProperty({
    description: 'Número de placa del agente (username)',
    example: 'AGT-001',
  })
  @IsString()
  @IsNotEmpty()
  numPlaca: string;

  @ApiProperty({
    description: 'Contraseña del agente',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  contrasena: string;
}
