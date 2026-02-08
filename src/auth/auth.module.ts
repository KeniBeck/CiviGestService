import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AgentesAuthService } from './agentes-auth.service';
import { AgentesAuthController } from './agentes-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAgenteStrategy } from './strategies/jwt-agente.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtAgenteAuthGuard } from './guards/jwt-agente-auth.guard';
import { JwtHybridAuthGuard } from './guards/jwt-hybrid-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [
    AuthController,
    AgentesAuthController, // ✅ Controller de autenticación de agentes
  ],
  providers: [
    AuthService,
    AgentesAuthService, // ✅ Servicio de autenticación de agentes
    JwtStrategy,
    JwtAgenteStrategy, // ✅ Strategy JWT para agentes
    JwtAuthGuard,
    JwtAgenteAuthGuard, // ✅ Guard específico para agentes
    JwtHybridAuthGuard, // ✅ Guard híbrido (usuarios + agentes)
    // Aplicar JwtAuthGuard globalmente (solo usuarios normales)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [AuthService, AgentesAuthService, JwtModule],
})
export class AuthModule {}
