import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SedesModule } from './sedes/sedes.module';
import { SubsedesModule } from './sudsedes/sudsedes.module';
import { UserModule } from './user/user.module';
import { MultaModule } from './multa/multa.module';
import { DepartamentoModule } from './departamento/departamento.module';
import { TipoAgenteModule } from './tipo-agente/tipo-agente.module';
import { AgenteModule } from './agente/agente.module';
import { PatrullaModule } from './patrulla/patrulla.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { ThemeModule } from './theme/theme.module';
import { TipoPermisoModule } from './tipo-permiso/tipo-permiso.module';
import { PermisoModule } from './permiso/permiso.module';
import { PagosPermisosModule } from './pagos-permisos/pagos-permisos.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { ImagenesModule } from './imagenes/imagenes.module';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Módulo común (global)
    CommonModule,
    // Módulos de la aplicación
    PrismaModule,
    AuthModule,
    SedesModule,
    SubsedesModule,
    UserModule,
    MultaModule,
    DepartamentoModule,
    TipoAgenteModule,
    AgenteModule,
    PatrullaModule,
    ConfiguracionModule,
    ThemeModule,
    TipoPermisoModule,
    PermisoModule,
    PagosPermisosModule,
    RoleModule,
    PermissionModule,
    ImagenesModule,
  ]
})
export class AppModule {}
