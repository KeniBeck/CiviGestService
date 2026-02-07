import { ApiProperty } from '@nestjs/swagger';

export class DocumentoResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sedeId: number;

  @ApiProperty()
  subsedeId: number;

  @ApiProperty()
  titulo: string;

  @ApiProperty({ required: false })
  descripcion?: string;

  @ApiProperty()
  nombreArchivo: string;

  @ApiProperty()
  rutaArchivo: string;

  @ApiProperty()
  tamanoBytes: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty({ required: false })
  tipo?: string;

  @ApiProperty({ required: false })
  entidadRelacionada?: string;

  @ApiProperty({ required: false })
  entidadId?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  createdBy?: number;
}
