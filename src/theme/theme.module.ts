import { Module } from '@nestjs/common';
import { ThemeService } from './service/theme.service';
import { FinderThemesService } from './service/finder-themes.service';
import { ThemeController } from './theme.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ThemeController],
  providers: [ThemeService, FinderThemesService],
  exports: [ThemeService, FinderThemesService],
})
export class ThemeModule {}
