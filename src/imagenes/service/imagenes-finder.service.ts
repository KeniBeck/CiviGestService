import { 
  Injectable, 
  Logger, 
  NotFoundException,
} from '@nestjs/common';
import { join } from 'path';
import { existsSync, statSync, createReadStream, readdirSync } from 'fs';
import { IMAGES_PATH } from '../../config/variables';
import type { ImageType } from './imagenes.service';

export interface ImageMetadata {
  filename: string;
  type: ImageType;
  path: string;
  size: number;
  mimetype: string;
  exists: boolean;
  createdAt: Date;
  url: string;
}

@Injectable()
export class ImagenesFinderService {
  private readonly logger = new Logger(ImagenesFinderService.name);

  /**
   * Obtiene el stream de una imagen para servirla
   * @param type - Tipo de imagen
   * @param filename - Nombre del archivo
   */
  getImageStream(type: ImageType, filename: string) {
    const filepath = join(IMAGES_PATH, type, filename);

    if (!existsSync(filepath)) {
      this.logger.warn(`⚠️ Imagen no encontrada: ${type}/${filename}`);
      throw new NotFoundException(`Imagen no encontrada: ${filename}`);
    }

    this.logger.log(`📤 Sirviendo imagen: ${type}/${filename}`);
    return createReadStream(filepath);
  }

  /**
   * Obtiene metadata de una imagen
   * @param type - Tipo de imagen
   * @param filename - Nombre del archivo
   */
  getImageMetadata(type: ImageType, filename: string): ImageMetadata {
    const filepath = join(IMAGES_PATH, type, filename);
    const exists = existsSync(filepath);

    if (!exists) {
      throw new NotFoundException(`Imagen no encontrada: ${filename}`);
    }

    const stats = statSync(filepath);
    const mimetype = this.getMimetypeFromExtension(filename);

    return {
      filename,
      type,
      path: filepath,
      size: stats.size,
      mimetype,
      exists,
      createdAt: stats.birthtime,
      url: `/imagenes/${type}/${filename}`,
    };
  }

  /**
   * Lista todas las imágenes de un tipo específico
   * @param type - Tipo de imagen
   */
  listImagesByType(type: ImageType): ImageMetadata[] {
    const directoryPath = join(IMAGES_PATH, type);

    if (!existsSync(directoryPath)) {
      this.logger.warn(`⚠️ Directorio no encontrado: ${type}/`);
      return [];
    }

    try {
      const files = readdirSync(directoryPath);
      
      return files
        .filter(file => this.isImageFile(file))
        .map(filename => {
          try {
            return this.getImageMetadata(type, filename);
          } catch (error) {
            this.logger.warn(`⚠️ Error al obtener metadata de ${filename}: ${error.message}`);
            return null;
          }
        })
        .filter((metadata): metadata is ImageMetadata => metadata !== null);
    } catch (error) {
      this.logger.error(`❌ Error al listar imágenes de ${type}: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca imágenes por ID (para buscar todas las versiones de una entidad)
   * @param type - Tipo de imagen
   * @param id - ID del registro
   */
  findImagesByEntityId(type: ImageType, id: number): ImageMetadata[] {
    const allImages = this.listImagesByType(type);
    const prefix = `${id}-`;
    
    return allImages.filter(img => img.filename.startsWith(prefix));
  }

  /**
   * Obtiene la imagen más reciente de una entidad
   * @param type - Tipo de imagen
   * @param id - ID del registro
   * @param subId - ID secundario opcional
   */
  getLatestImageByEntityId(type: ImageType, id: number, subId?: number): ImageMetadata | null {
    const images = this.findImagesByEntityId(type, id);
    
    const filtered = subId 
      ? images.filter(img => img.filename.includes(`${id}-${subId}-`))
      : images;

    if (filtered.length === 0) {
      return null;
    }

    // Ordenar por fecha de creación (más reciente primero)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return filtered[0];
  }

  /**
   * Verifica si una imagen existe
   * @param type - Tipo de imagen
   * @param filename - Nombre del archivo
   */
  imageExists(type: ImageType, filename: string): boolean {
    const filepath = join(IMAGES_PATH, type, filename);
    return existsSync(filepath);
  }

  /**
   * Obtiene el mimetype según la extensión del archivo
   */
  private getMimetypeFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const extToMime: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
    };

    return extToMime[extension || ''] || 'application/octet-stream';
  }

  /**
   * Verifica si un archivo es una imagen válida
   */
  private isImageFile(filename: string): boolean {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? validExtensions.includes(extension) : false;
  }
}
