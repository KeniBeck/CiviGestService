import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * JWT Hybrid Auth Guard
 * Protege rutas que requieren autenticación de usuarios O agentes
 * Intenta validar con ambas estrategias (jwt y jwt-agente)
 * Permite marcar rutas como públicas con el decorador @Public()
 */
@Injectable()
export class JwtHybridAuthGuard extends AuthGuard(['jwt', 'jwt-agente']) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Este guard SIEMPRE valida el token (usuarios o agentes)
    // El decorador @Public() solo debe afectar al guard global, NO a este
    console.log('JwtHybridAuthGuard: Validando autenticación híbrida (usuarios o agentes)');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    // Si hay usuario válido de cualquier estrategia, retornarlo
    if (user) {
      return user;
    }

    // Si hay error específico, lanzar excepción apropiada
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token expirado');
    }
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Token inválido');
    }
    if (info?.name === 'NotBeforeError') {
      throw new UnauthorizedException('Token aún no es válido');
    }
    
    // Si llegamos aquí, ninguna estrategia validó exitosamente
    throw err || new UnauthorizedException('No autorizado - Token inválido o no proporcionado');
  }
}
