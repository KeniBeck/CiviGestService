import { Module } from '@nestjs/common';
import { ImagenesService } from './service/imagenes.service';
import { ImagenesFinderService } from './service/imagenes-finder.service';
import { ImagenesController } from './imagenes.controller';

@Module({
  controllers: [ImagenesController],
  providers: [ImagenesService, ImagenesFinderService],
  exports: [ImagenesService, ImagenesFinderService], // Exportar para uso en otros módulos
})
export class ImagenesModule {}
