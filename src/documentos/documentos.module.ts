import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentosService } from './service/documentos.service';
import { DocumentosController } from './documentos.controller';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import { homedir } from 'os';
import { DOCUMENTS_PATH } from '../config/variables';

// Función para expandir ~ al directorio home o resolver ruta relativa
function resolvePath(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return join(homedir(), filePath.slice(2));
  }
  // Si es ruta relativa, resolver desde el directorio del proyecto
  return resolve(process.cwd(), filePath);
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: resolvePath(DOCUMENTS_PATH),
        filename: (req, file, callback) => {
          // Generar nombre único para el archivo
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB máximo
      },
      fileFilter: (req, file, callback) => {
        // Solo permitir archivos PDF
        if (file.mimetype === 'application/pdf') {
          callback(null, true);
        } else {
          callback(new Error('Solo se permiten archivos PDF'), false);
        }
      },
    }),
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
