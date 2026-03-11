import { Module } from '@nestjs/common';
import { InfraccionesService } from './services/infracciones.service';
import { InfraccionesFinderService } from './services/infracciones-finder.service';
import { InfraccionesController } from './infracciones.controller';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from '../common/services/pagination/pagination.service';
import { InfraccionesPaginationService } from '../common/services/pagination/infracciones/infracciones-pagination.service';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [InfraccionesController],
  providers: [
    InfraccionesService,
    InfraccionesFinderService,
    PaginationService,
    InfraccionesPaginationService,
  ],
  exports: [InfraccionesService, InfraccionesFinderService],
})
export class InfraccionesModule {}
