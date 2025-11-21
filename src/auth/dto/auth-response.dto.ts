import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Tipo de token',
  })
  tokenType: string;

  @ApiProperty({
    example: 604800,
    description: 'Tiempo de expiración en segundos',
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información del usuario',
  })
  user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    sedeId: number; // Ya no es nullable, siempre pertenece a una Sede
    subsedeId: number | null;
    accessLevel: string;
    roles: string[];
  };
}
