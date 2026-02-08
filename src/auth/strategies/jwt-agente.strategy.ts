import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAgenteStrategy extends PassportStrategy(
  Strategy,
  'jwt-agente',
) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET_AGENTES');
    if (!secret) {
      throw new Error('JWT_SECRET_AGENTES no está configurado en las variables de entorno');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Validar que el agente aún existe y está activo
    const agente = await this.prisma.agente.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!agente || !agente.isActive || agente.deletedAt) {
      throw new UnauthorizedException('Agente inactivo o no encontrado');
    }

    // Retornar datos del agente para req.user (compatible con RequestUser interface)
    const permissions = agente.roles.flatMap((ar) =>
      ar.role.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`,
      ),
    );

    const roles = agente.roles.map((ar) => ar.role.name);

    return {
      sub: agente.id,
      userId: agente.id, // Alias para compatibilidad
      email: agente.correo,
      username: agente.numPlaca, // Usar numPlaca como username
      numPlaca: agente.numPlaca,
      sedeId: agente.sedeId,
      subsedeId: agente.subsedeId,
      accessLevel: 'OPERATIVO' as any, // Los agentes son nivel operativo
      roles,
      permissions, // ✅ Cambiado de 'permisos' a 'permissions'
      isAgente: true, // ✅ Identificador crucial
      sedeAccessIds: [], // Los agentes no tienen acceso multi-sede
      subsedeAccessIds: [], // Los agentes solo acceden a su subsede
    };
  }
}
