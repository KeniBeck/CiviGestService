import { Module } from '@nestjs/common';
import { SedesService } from './service/sedes.service';
import { SedesController } from './sedes.controller';
import { FinderSedesService } from './service/finder-sedes.service';
import { SubsedesModule } from '../sudsedes/sudsedes.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [SubsedesModule, PrismaModule],
  controllers: [SedesController],
  providers: [
    SedesService,
    FinderSedesService
  ],
  exports: [SedesService],
})
export class SedesModule { }
