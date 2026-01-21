import { Module, Global } from '@nestjs/common';
import { ValidationService } from './services/validation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaginationService } from './services/pagination/pagination.service';
import { PaginationSubsedesService } from './services/pagination/subsedes/subsedes-pagination.service';
import { PaginationSedesService } from './services/pagination/sedes/sedes-pagination.service';
import { PaginationUsersService } from './services/pagination/user/user-pagination.service';
import { DepartamentoPaginationService } from './services/pagination/departamento/departamento-pagination.service';
import { MultaPaginationService } from './services/pagination/multa/multa-pagination.service';
import { TipoAgentePaginationService } from './services/pagination/tipo-agente/tipo-agente-pagination.service';
import { AgentePaginationService } from './services/pagination/agente/agente-pagination.service';
import { PatrullaPaginationService } from './services/pagination/patrulla/patrulla-pagination.service';
import { ConfiguracionPaginationService } from './services/pagination/configuracion/configuracion-pagination.service';
import { ThemePaginationService } from './services/pagination/theme/theme-pagination.service';
import { PermisoPaginationService } from './services/pagination/permiso/permiso-pagination.service';
import { RolePaginationService } from './services/pagination/role/role-pagination.service';
import { PermissionPaginationService } from './services/pagination/permission/permission-pagination.service';


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
    DepartamentoPaginationService,
    MultaPaginationService,
    TipoAgentePaginationService,
    AgentePaginationService,
    PatrullaPaginationService,
    ConfiguracionPaginationService,
    ThemePaginationService,
    PermisoPaginationService,
    RolePaginationService,
    PermissionPaginationService,
  ],
  exports: [
    ValidationService,
    PaginationService,
    PaginationSubsedesService,
    PaginationSedesService,
    PaginationUsersService,
    DepartamentoPaginationService,
    MultaPaginationService,
    TipoAgentePaginationService,
    AgentePaginationService,
    PatrullaPaginationService,
    ConfiguracionPaginationService,
    ThemePaginationService,
    PermisoPaginationService,
    RolePaginationService,
    PermissionPaginationService,
  ],
})
export class CommonModule { }
