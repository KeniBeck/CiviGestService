import { Module } from '@nestjs/common';
import { PagosPermisosService } from './services/pagos-permisos.service';
import { PagosPermisosFinderService } from './services/pagos-permisos-finder.service';
import { PagosPermisosController } from './pagos-permisos.controller';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from '../common/services/pagination/pagination.service';
import { PagosPermisosPaginationService } from '../common/services/pagination/pagos-permisos/pagos-permisos-pagination.service';

@Module({
  imports: [CommonModule, PrismaModule],
  controllers: [PagosPermisosController],
  providers: [
    PagosPermisosService,
    PagosPermisosFinderService,
    PaginationService,
    PagosPermisosPaginationService,
  ],
  exports: [PagosPermisosService, PagosPermisosFinderService],
})
export class PagosPermisosModule {}
