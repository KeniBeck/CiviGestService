import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Param, 
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ImagenesService } from './service/imagenes.service';
import { ImagenesFinderService } from './service/imagenes-finder.service';
import type { ImageType } from './service/imagenes.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Imágenes')
@ApiBearerAuth()
@Controller('imagenes')
export class ImagenesController {
  private readonly logger = new Logger(ImagenesController.name);

  constructor(
    private readonly imagenesService: ImagenesService,
    private readonly imagenesFinderService: ImagenesFinderService,
  ) {}

  /**
   * Subir una imagen
   * POST /imagenes/upload/:type?id=1&subId=2
   */
  @Post('upload/:type')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir una nueva imagen' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg, png, webp)',
        },
      },
      required: ['file'],
    },
  })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  @ApiQuery({ name: 'id', type: Number, description: 'ID del registro principal' })
  @ApiQuery({ name: 'subId', type: Number, required: false, description: 'ID secundario (opcional)' })
  async uploadImage(
    @Param('type') type: ImageType,
    @Query('id', ParseIntPipe) id: number,
    @Query('subId') subId: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.imagenesService.validateImageFile(file);

    const subIdNumber = subId ? parseInt(subId, 10) : undefined;

    const result = await this.imagenesService.handleUpload(file, id, type, subIdNumber);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Imagen subida exitosamente',
      data: result,
    };
  }

  /**
   * Reemplazar una imagen existente
   * PUT /imagenes/replace/:type/:filename?id=1&subId=2
   */
  @Post('replace/:type/:filename')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Reemplazar una imagen existente' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Nuevo archivo de imagen (jpg, png, webp)',
        },
      },
      required: ['file'],
    },
  })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo a reemplazar' })
  @ApiQuery({ name: 'id', type: Number, description: 'ID del registro principal' })
  @ApiQuery({ name: 'subId', type: Number, required: false, description: 'ID secundario (opcional)' })
  async replaceImage(
    @Param('type') type: ImageType,
    @Param('filename') filename: string,
    @Query('id', ParseIntPipe) id: number,
    @Query('subId') subId: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    this.imagenesService.validateImageFile(file);

    const subIdNumber = subId ? parseInt(subId, 10) : undefined;

    const result = await this.imagenesService.replaceImage(
      filename, 
      file, 
      id, 
      type, 
      subIdNumber
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Imagen reemplazada exitosamente',
      data: result,
    };
  }

  /**
   * Servir una imagen (endpoint público)
   * GET /imagenes/:type/:filename
   */
  @Public()
  @Get(':type/:filename')
  @ApiOperation({ summary: 'Obtener una imagen' })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo' })
  async serveImage(
    @Param('type') type: ImageType,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const metadata = this.imagenesFinderService.getImageMetadata(type, filename);
      const stream = this.imagenesFinderService.getImageStream(type, filename);

      res.setHeader('Content-Type', metadata.mimetype);
      res.setHeader('Content-Length', metadata.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año

      stream.pipe(res);
    } catch (error) {
      this.logger.error(`Error al servir imagen: ${error.message}`);
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Imagen no encontrada',
      });
    }
  }

  /**
   * Eliminar una imagen
   * DELETE /imagenes/:type/:filename
   */
  @Delete(':type/:filename')
  @ApiOperation({ summary: 'Eliminar una imagen' })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo a eliminar' })
  async deleteImage(
    @Param('type') type: ImageType,
    @Param('filename') filename: string,
  ) {
    await this.imagenesService.deleteImage(filename, type);

    return {
      statusCode: HttpStatus.OK,
      message: 'Imagen eliminada exitosamente',
    };
  }

  /**
   * Listar todas las imágenes de un tipo
   * GET /imagenes/list/:type
   */
  @Get('list/:type')
  @ApiOperation({ summary: 'Listar todas las imágenes de un tipo' })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  async listImages(@Param('type') type: ImageType) {
    const images = this.imagenesFinderService.listImagesByType(type);

    return {
      statusCode: HttpStatus.OK,
      message: 'Listado de imágenes obtenido exitosamente',
      data: images,
      total: images.length,
    };
  }

  /**
   * Obtener metadata de una imagen
   * GET /imagenes/metadata/:type/:filename
   */
  @Get('metadata/:type/:filename')
  @ApiOperation({ summary: 'Obtener metadata de una imagen' })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  @ApiParam({ name: 'filename', description: 'Nombre del archivo' })
  async getImageMetadata(
    @Param('type') type: ImageType,
    @Param('filename') filename: string,
  ) {
    const metadata = this.imagenesFinderService.getImageMetadata(type, filename);

    return {
      statusCode: HttpStatus.OK,
      message: 'Metadata obtenida exitosamente',
      data: metadata,
    };
  }

  /**
   * Obtener imágenes de una entidad específica
   * GET /imagenes/entity/:type/:id
   */
  @Get('entity/:type/:id')
  @ApiOperation({ summary: 'Obtener todas las imágenes de una entidad' })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  @ApiParam({ name: 'id', description: 'ID de la entidad' })
  async getImagesByEntityId(
    @Param('type') type: ImageType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const images = this.imagenesFinderService.findImagesByEntityId(type, id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Imágenes de la entidad obtenidas exitosamente',
      data: images,
      total: images.length,
    };
  }

  /**
   * Obtener la imagen más reciente de una entidad
   * GET /imagenes/latest/:type/:id?subId=2
   */
  @Get('latest/:type/:id')
  @ApiOperation({ summary: 'Obtener la imagen más reciente de una entidad' })
  @ApiParam({ name: 'type', enum: ['configuraciones', 'permisos', 'usuarios', 'comprobantes', 'documentos'] })
  @ApiParam({ name: 'id', description: 'ID de la entidad' })
  @ApiQuery({ name: 'subId', type: Number, required: false, description: 'ID secundario (opcional)' })
  async getLatestImage(
    @Param('type') type: ImageType,
    @Param('id', ParseIntPipe) id: number,
    @Query('subId') subId: string | undefined,
  ) {
    const subIdNumber = subId ? parseInt(subId, 10) : undefined;
    const latestImage = this.imagenesFinderService.getLatestImageByEntityId(type, id, subIdNumber);

    if (!latestImage) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No se encontraron imágenes para esta entidad',
        data: null,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Imagen más reciente obtenida exitosamente',
      data: latestImage,
    };
  }
}
