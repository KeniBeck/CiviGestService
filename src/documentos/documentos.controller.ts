import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentosService } from './service/documentos.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DOCUMENTS_PATH } from '../config/variables';
import { JwtAuthGuard, PermissionsGuard, Public, RolesGuard } from 'src/auth';

@ApiTags('Documentos')
@Controller('documentos')
export class DocumentosController {
  private readonly documentsDir: string;

  constructor(private readonly documentosService: DocumentosService) {
    // Resolver path (expandir ~ o ruta relativa)
    this.documentsDir = this.resolvePath(DOCUMENTS_PATH);
  }

  /**
   * Resuelve el path: expande ~ al directorio home o resuelve ruta relativa
   */
  private resolvePath(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    // Si es ruta relativa, resolver desde el directorio del proyecto
    return path.resolve(process.cwd(), filePath);
  }

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @UseGuards()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir un documento PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF a subir',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        nombreArchivo: { type: 'string' },
        rutaArchivo: { type: 'string' },
        tamanoBytes: { type: 'number' },
        mimeType: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo no es PDF o no se proporcionó' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    return this.documentosService.uploadFile(file);
  }

  @Post('upload-multiple')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  @ApiOperation({ summary: 'Subir múltiples documentos PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Archivos PDF a subir (máximo 10)',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documentos subidos exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombreArchivo: { type: 'string' },
          rutaArchivo: { type: 'string' },
          tamanoBytes: { type: 'number' },
          mimeType: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivos no son PDF o no se proporcionaron' })
  async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    return this.documentosService.uploadMultipleFiles(files);
  }

  @Public()
  @Get('download/:filename')
  @ApiOperation({ summary: 'Descargar un archivo PDF por nombre de archivo' })
  @ApiResponse({ status: 200, description: 'Archivo PDF' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = path.join(this.documentsDir, filename);
    
    try {
      const absolutePath = await this.documentosService.getFile(filePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(absolutePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Archivo no encontrado');
    }
  }

  @Public()
  @Get('view/:filename')
  @ApiOperation({ summary: 'Ver un archivo PDF en el navegador' })
  @ApiResponse({ status: 200, description: 'Archivo PDF para visualización' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async viewFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = path.join(this.documentsDir, filename);
    
    try {
      const absolutePath = await this.documentosService.getFile(filePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');

      const fileStream = fs.createReadStream(absolutePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Archivo no encontrado');
    }
  }

  @Post('replace/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Reemplazar un archivo PDF existente' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Nuevo archivo PDF',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo reemplazado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async replaceFile(
    @Param('filename') filename: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const oldFilePath = path.join(this.documentsDir, filename);
    return this.documentosService.replaceFile(oldFilePath, file);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Eliminar un archivo PDF' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async deleteFile(@Param('filename') filename: string) {
    const filePath = path.join(this.documentsDir, filename);
    
    // Verificar que el archivo existe antes de eliminarlo
    if (!this.documentosService.fileExists(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    await this.documentosService.deleteFile(filePath);
    return { message: 'Archivo eliminado exitosamente' };
  }

  @Get('info/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Obtener información de un archivo' })
  @ApiResponse({
    status: 200,
    description: 'Información del archivo',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' },
        size: { type: 'number' },
        path: { type: 'string' },
      },
    },
  })
  async getFileInfo(@Param('filename') filename: string) {
    const filePath = path.join(this.documentsDir, filename);
    return this.documentosService.getFileInfo(filePath);
  }
}
