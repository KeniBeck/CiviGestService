import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { FinderUserService } from './service/finder-user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [UserController],
  providers: [UserService, FinderUserService],
  exports: [UserService, FinderUserService],
})
export class UserModule {}
