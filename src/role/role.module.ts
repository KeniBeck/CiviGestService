import { Module } from '@nestjs/common';
import { RoleService } from './service/role.service';
import { RoleFinderService } from './service/role-finder.service';
import { RolePermissionService } from './service/role-permission.service';
import { RoleController } from './role.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [RoleController],
  providers: [RoleService, RoleFinderService, RolePermissionService],
  exports: [RoleService, RoleFinderService, RolePermissionService],
})
export class RoleModule {}
