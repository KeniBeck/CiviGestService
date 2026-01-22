import { 
  Injectable, 
  Logger, 
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { IMAGES_PATH } from '../../config/variables';

export interface ImageUploadResult {
  filename: string;
  url: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedAt: Date;
}

export type ImageType = 
  | 'configuraciones'  // Logos de sedes/subsedes
  | 'permisos'         // Imágenes de permisos ciudadanos
  | 'usuarios'         // Fotos de perfil de usuarios
  | 'comprobantes'     // Comprobantes de pago
  | 'documentos';      // Documentos adjuntos generales

@Injectable()
export class ImagenesService {
  private readonly logger = new Logger(ImagenesService.name);
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/pjpeg',
  ];

  constructor() {
    // Asegurar que existan los directorios al iniciar el servicio
    this.ensureUploadDirectory('configuraciones');
    this.ensureUploadDirectory('permisos');
    this.ensureUploadDirectory('usuarios');
    this.ensureUploadDirectory('comprobantes');
    this.ensureUploadDirectory('documentos');
  }

  /**
   * Asegura que el directorio de uploads existe
   */
  private async ensureUploadDirectory(type: ImageType): Promise<void> {
    try {
      const uploadPath = join(IMAGES_PATH, type);
      if (!existsSync(uploadPath)) {
        await mkdir(uploadPath, { recursive: true });
        this.logger.log(`✅ Directorio creado: ${uploadPath}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error al crear directorio ${type}: ${error.message}`);
      throw new BadRequestException(`No se pudo crear el directorio de imágenes`);
    }
  }

  /**
   * Maneja subida de imagen desde form-data (Multer)
   * @param file - Archivo de Multer
   * @param id - ID del registro (sede, permiso, etc.)
   * @param type - Tipo de imagen (configuraciones, permisos, etc.)
   * @param subId - ID secundario opcional (ej: subsedeId para configuraciones)
   */
  async handleUpload(
    file: Express.Multer.File, 
    id: number, 
    type: ImageType, 
    subId?: number
  ): Promise<ImageUploadResult> {
    try {
      // 1. Validar tipo MIME
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Tipo de archivo no permitido. Permitidos: ${this.allowedMimeTypes.join(', ')}`
        );
      }

      // 2. Validar tamaño
      if (file.size > this.maxFileSize) {
        throw new BadRequestException(
          `Archivo muy grande. Máximo ${this.maxFileSize / (1024 * 1024)}MB`
        );
      }

      // 3. Asegurar directorio
      await this.ensureUploadDirectory(type);

      // 4. Generar nombre único con timestamp para evitar cache
      const timestamp = Date.now();
      const extension = this.getExtensionFromMimetype(file.mimetype);
      const filename = subId 
        ? `${id}-${subId}-${timestamp}.${extension}` 
        : `${id}-${timestamp}.${extension}`;
      
      const filepath = join(IMAGES_PATH, type, filename);

      // 5. Guardar archivo
      await writeFile(filepath, file.buffer);

      this.logger.log(`✅ Imagen guardada: ${filename} en ${type}/ (${this.formatBytes(file.size)})`);

      // 6. Retornar información del archivo
      return {
        filename,
        url: `/imagenes/${type}/${filename}`,
        path: filepath,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
      };

    } catch (error) {
      this.logger.error(`❌ Error al procesar imagen: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina una imagen del sistema de archivos
   * @param filename - Nombre del archivo a eliminar
   * @param type - Tipo de imagen
   */
  async deleteImage(filename: string, type: ImageType): Promise<void> {
    try {
      const filepath = join(IMAGES_PATH, type, filename);
      
      // Verificar que el archivo existe
      if (!existsSync(filepath)) {
        this.logger.warn(`⚠️ Imagen no encontrada para eliminar: ${filename}`);
        return;
      }

      await unlink(filepath);
      this.logger.log(`🗑️ Imagen eliminada: ${filename} de ${type}/`);
    } catch (error) {
      this.logger.error(`❌ Error al eliminar imagen ${filename}: ${error.message}`);
      throw new BadRequestException('No se pudo eliminar la imagen');
    }
  }

  /**
   * Elimina una imagen antigua y sube una nueva (útil para actualizaciones)
   * @param oldFilename - Nombre del archivo anterior
   * @param file - Nuevo archivo
   * @param id - ID del registro
   * @param type - Tipo de imagen
   * @param subId - ID secundario opcional
   */
  async replaceImage(
    oldFilename: string | null,
    file: Express.Multer.File,
    id: number,
    type: ImageType,
    subId?: number,
  ): Promise<ImageUploadResult> {
    // Subir nueva imagen
    const result = await this.handleUpload(file, id, type, subId);

    // Eliminar imagen anterior si existe
    if (oldFilename) {
      await this.deleteImage(oldFilename, type).catch(err => {
        this.logger.warn(`No se pudo eliminar imagen anterior: ${err.message}`);
      });
    }

    return result;
  }

  /**
   * Valida que un archivo sea una imagen válida
   */
  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Permitidos: jpg, jpeg, png, webp`
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Archivo muy grande. Máximo ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }
  }

  /**
   * Obtiene la extensión correcta según el mimetype
   */
  private getExtensionFromMimetype(mimetype: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/pjpeg': 'jpg',
    };

    return mimeToExt[mimetype] || 'jpg';
  }

  /**
   * Formatea bytes a formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
