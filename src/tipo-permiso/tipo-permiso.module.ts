import { Module } from '@nestjs/common';
import { TipoPermisoController } from './tipo-permiso.controller';
import { TipoPermisoService } from './service/tipo-permiso.service';
import { FinderTipoPermisoService } from './service/finder.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { TipoPermisoPaginationService } from '../common/services/pagination/tipo-permiso/tipo-permiso-pagination.service';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [TipoPermisoController],
  providers: [
    TipoPermisoService,
    FinderTipoPermisoService,
    TipoPermisoPaginationService,
  ],
  exports: [TipoPermisoService, FinderTipoPermisoService],
})
export class TipoPermisoModule {}
