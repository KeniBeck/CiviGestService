import { Module, Global } from '@nestjs/common';
import { ValidationService } from './services/validation.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * CommonModule - Módulo global con servicios compartidos
 * 
 * @Global decorator hace que este módulo esté disponible 
 * en toda la aplicación sin necesidad de importarlo explícitamente
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class CommonModule {}
