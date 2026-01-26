import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { DOCUMENTS_PATH } from '../../config/variables';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class DocumentosService {
  // Directorio base para almacenar documentos
  private readonly uploadDir: string;

  constructor() {
    // Resolver path (expandir ~ o ruta relativa) y asegurar que el directorio existe
    this.uploadDir = this.resolvePath(DOCUMENTS_PATH);
    this.ensureUploadDirExists();
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

  /**
   * Asegura que el directorio de subida existe
   */
  private async ensureUploadDirExists(): Promise<void> {
    try {
      await mkdirAsync(this.uploadDir, { recursive: true });
      console.log(`Directorio de documentos creado/verificado en: ${this.uploadDir}`);
    } catch (error) {
      console.error('Error al crear directorio de documentos:', error);
    }
  }

  /**
   * Sube un archivo PDF y retorna la ruta
   */
  async uploadFile(file: Express.Multer.File): Promise<{
    nombreArchivo: string;
    rutaArchivo: string;
    tamanoBytes: number;
    mimeType: string;
  }> {
    // Validar que el archivo es un PDF
    if (file.mimetype !== 'application/pdf') {
      // Eliminar archivo si no es PDF
      await this.deleteFile(file.path);
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    try {
      return {
        nombreArchivo: file.originalname,
        rutaArchivo: file.path,
        tamanoBytes: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      // Si falla, eliminar el archivo
      await this.deleteFile(file.path);
      throw new InternalServerErrorException(
        'Error al procesar el archivo',
        error.message,
      );
    }
  }

  /**
   * Sube múltiples archivos PDF
   */
  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<
    {
      nombreArchivo: string;
      rutaArchivo: string;
      tamanoBytes: number;
      mimeType: string;
    }[]
  > {
    const uploadedFiles: {
      nombreArchivo: string;
      rutaArchivo: string;
      tamanoBytes: number;
      mimeType: string;
    }[] = [];

    for (const file of files) {
      try {
        const fileInfo = await this.uploadFile(file);
        uploadedFiles.push(fileInfo);
      } catch (error) {
        // Si un archivo falla, eliminar los que ya se subieron
        for (const uploaded of uploadedFiles) {
          await this.deleteFile(uploaded.rutaArchivo);
        }
        throw error;
      }
    }

    return uploadedFiles;
  }

  /**
   * Obtiene un archivo por su ruta
   */
  async getFile(rutaArchivo: string): Promise<string> {
    // Verificar que el archivo existe
    if (!fs.existsSync(rutaArchivo)) {
      throw new NotFoundException('Archivo no encontrado en el sistema');
    }

    return rutaArchivo;
  }

  /**
   * Elimina un archivo del sistema de archivos
   */
  async deleteFile(rutaArchivo: string): Promise<void> {
    try {
      if (fs.existsSync(rutaArchivo)) {
        await unlinkAsync(rutaArchivo);
      }
    } catch (error) {
      console.error(`Error al eliminar archivo ${rutaArchivo}:`, error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Elimina múltiples archivos
   */
  async deleteMultipleFiles(rutas: string[]): Promise<void> {
    for (const ruta of rutas) {
      await this.deleteFile(ruta);
    }
  }

  /**
   * Reemplaza un archivo existente con uno nuevo
   */
  async replaceFile(
    rutaArchivo: string,
    newFile: Express.Multer.File,
  ): Promise<{
    nombreArchivo: string;
    rutaArchivo: string;
    tamanoBytes: number;
    mimeType: string;
  }> {
    // Validar que el nuevo archivo es un PDF
    if (newFile.mimetype !== 'application/pdf') {
      await this.deleteFile(newFile.path);
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    try {
      // Eliminar archivo anterior si existe
      await this.deleteFile(rutaArchivo);

      // Retornar información del nuevo archivo
      return {
        nombreArchivo: newFile.originalname,
        rutaArchivo: newFile.path,
        tamanoBytes: newFile.size,
        mimeType: newFile.mimetype,
      };
    } catch (error) {
      // Si falla, eliminar el nuevo archivo
      await this.deleteFile(newFile.path);
      throw new InternalServerErrorException(
        'Error al reemplazar el archivo',
        error.message,
      );
    }
  }

  /**
   * Valida que un archivo existe
   */
  fileExists(rutaArchivo: string): boolean {
    return fs.existsSync(rutaArchivo);
  }

  /**
   * Obtiene información de un archivo
   */
  getFileInfo(rutaArchivo: string): {
    exists: boolean;
    size?: number;
    path?: string;
  } {
    if (!fs.existsSync(rutaArchivo)) {
      return { exists: false };
    }

    const stats = fs.statSync(rutaArchivo);
    return {
      exists: true,
      size: stats.size,
      path: rutaArchivo,
    };
  }
}
