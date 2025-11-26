import { Module, Global } from '@nestjs/common';
import { ValidationService } from './services/validation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from './services/pagination/pagination.service';
import { PaginationSubsedesService } from './services/pagination/subsedes/subsedes-pagination.service';
import { PaginationSedesService } from './services/pagination/sedes/sedes-pagination.service';
import { PaginationUsersService } from './services/pagination/user/user-pagination.service';

/**
 * CommonModule - Módulo global con servicios compartidos
 * 
 * @Global decorator hace que este módulo esté disponible 
 * en toda la aplicación sin necesidad de importarlo explícitamente
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    ValidationService,
    PaginationService,
    PaginationSubsedesService,
    PaginationSedesService,
    PaginationUsersService,
  ],
  exports: [
    ValidationService,
    PaginationService,
    PaginationSubsedesService,
    PaginationSedesService,
    PaginationUsersService,
  ],
})
export class CommonModule { }
