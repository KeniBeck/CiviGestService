import { Module } from '@nestjs/common';
import { PatrullaService } from './service/patrulla.service';
import { FinderPatrullaService } from './service/finder-patrulla.service';
import { PatrullaController } from './patrulla.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PatrullaController],
  providers: [PatrullaService, FinderPatrullaService],
  exports: [PatrullaService, FinderPatrullaService],
})
export class PatrullaModule {}
