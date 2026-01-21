import { Module } from '@nestjs/common';
import { PermissionService } from './service/permission.service';
import { PermissionFinderService } from './service/permission-finder.service';
import { PermissionController } from './permission.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PermissionController],
  providers: [PermissionService, PermissionFinderService],
  exports: [PermissionService, PermissionFinderService],
})
export class PermissionModule {}
