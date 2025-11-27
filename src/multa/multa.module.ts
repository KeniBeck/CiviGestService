import { Module } from '@nestjs/common';
import { MultaService } from './service/multa.service';
import { FinderMultaService } from './service/finder.service';
import { MultaController } from './multa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MultaController],
  providers: [MultaService, FinderMultaService],
  exports: [MultaService, FinderMultaService],
})
export class MultaModule {}
