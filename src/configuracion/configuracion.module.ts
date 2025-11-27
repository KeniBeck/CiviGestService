import { Module } from '@nestjs/common';
import { ConfiguracionService } from './service/configuracion.service';
import { FinderConfiguracionService } from './service/finder-configuracion.service';
import { ConfiguracionController } from './configuracion.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService, FinderConfiguracionService],
  exports: [ConfiguracionService, FinderConfiguracionService],
})
export class ConfiguracionModule {}
