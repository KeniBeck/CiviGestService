import { Module } from '@nestjs/common';
import { TipoAgenteService } from './service/tipo-agente.service';
import { FinderTipoAgenteService } from './service/finder-tipo-agente.service';
import { TipoAgenteController } from './tipo-agente.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [TipoAgenteController],
  providers: [TipoAgenteService, FinderTipoAgenteService],
  exports: [TipoAgenteService, FinderTipoAgenteService],
})
export class TipoAgenteModule {}
