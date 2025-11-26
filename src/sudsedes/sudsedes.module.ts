import { Module } from '@nestjs/common';
import { SubsedesService } from './service/sudsedes.service';
import { FinderSubsedesService } from './service/finder-sudsedes.service';
import { SubsedesController } from './sudsedes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
  ],
  controllers: [SubsedesController],
  providers: [SubsedesService, FinderSubsedesService],
  exports: [SubsedesService, FinderSubsedesService],
})
export class SubsedesModule {}
