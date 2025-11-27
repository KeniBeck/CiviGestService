import { Module } from '@nestjs/common';
import { AgenteService } from './service/agente.service';
import { FinderAgenteService } from './service/finder-agente.service';
import { AgenteController } from './agente.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgenteController],
  providers: [AgenteService, FinderAgenteService],
  exports: [AgenteService, FinderAgenteService],
})
export class AgenteModule {}
