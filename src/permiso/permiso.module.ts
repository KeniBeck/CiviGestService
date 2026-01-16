import { Module } from '@nestjs/common';
import { PermisoService } from './service/permiso.service';
import { PermisoController } from './permiso.controller';

@Module({
  controllers: [PermisoController],
  providers: [PermisoService],
})
export class PermisoModule {}
