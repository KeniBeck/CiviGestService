import { Module } from '@nestjs/common';
import { SedesService } from './service/sedes.service';
import { SedesController } from './sedes.controller';
import { FinderSedesService } from './service/finder-sedes.service';

@Module({
  controllers: [SedesController],
  providers: [
    SedesService,
    FinderSedesService
  ],
  exports: [SedesService],
})
export class SedesModule { }
