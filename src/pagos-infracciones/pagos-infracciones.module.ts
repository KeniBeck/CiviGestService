import { Module } from '@nestjs/common';
import { PagosInfraccionesService } from './services/pagos-infracciones.service';
import { PagosInfraccionesFinderService } from './services/pagos-infracciones-finder.service';
import { PagosInfraccionesController } from './pagos-infracciones.controller';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from '../common/services/pagination/pagination.service';
import { PagosInfraccionesPaginationService } from '../common/services/pagination/pagos-infracciones/pagos-infracciones-pagination.service';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [PagosInfraccionesController],
  providers: [
    PagosInfraccionesService,
    PagosInfraccionesFinderService,
    PaginationService,
    PagosInfraccionesPaginationService,
  ],
  exports: [PagosInfraccionesService, PagosInfraccionesFinderService],
})
export class PagosInfraccionesModule {}
