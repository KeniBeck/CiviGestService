import { Module } from '@nestjs/common';
import { PermisoService } from './service/permiso.service';
import { PermisoController } from './permiso.controller';
import { FinderPermisoService } from './service/finder-permiso.service';

@Module({
  controllers: [PermisoController],
  providers: [PermisoService,FinderPermisoService]
})
export class PermisoModule {}
