import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, RequestUser } from '../interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * JWT Strategy
 * Valida el token JWT y adjunta el usuario al request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Valida el payload del JWT
   * Se ejecuta automáticamente después de verificar la firma del token
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    // Verificar que el usuario existe y está activo
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        email: payload.email,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        tenantId: true,
        sedeId: true,
        subsedeId: true,
        accessLevel: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // Verificar que el tenant está activo
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id: user.tenantId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant inactivo o no encontrado');
    }

    // Retornar el usuario con toda la información del payload
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      tenantId: payload.tenantId,
      sedeId: payload.sedeId,
      subsedeId: payload.subsedeId,
      accessLevel: payload.accessLevel,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
