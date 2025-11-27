import { Module } from '@nestjs/common';
import { DepartamentoService } from './service/departamento.service';
import { FinderDepartamentoService } from './service/finder-departamento.service';
import { DepartamentoController } from './departamento.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DepartamentoController],
  providers: [DepartamentoService, FinderDepartamentoService],
  exports: [DepartamentoService, FinderDepartamentoService],
})
export class DepartamentoModule {}
