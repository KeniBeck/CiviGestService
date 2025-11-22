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
                sedeId: true,
                subsedeId: true,
                accessLevel: true,
                isActive: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado o inactivo');
        }

        // Verificar que si la sede esta activa
        const sede = await this.prisma.sede.findUnique({
            where: { id: user.sedeId },
            select: { isActive: true },
        });

        if (!sede || !sede.isActive) {
            throw new UnauthorizedException('La sede del usuario está inactiva');
        }

        // Retornar el usuario con toda la información del payload
        return {
            userId: payload.sub, // Alias de sub para facilitar el uso en controllers
            sub: payload.sub,
            email: payload.email,
            username: payload.username,
            sedeId: payload.sedeId,
            subsedeId: payload.subsedeId,
            accessLevel: payload.accessLevel,
            roles: payload.roles,
            permissions: payload.permissions,
            sedeAccessIds: payload.sedeAccessIds,
            subsedeAccessIds: payload.subsedeAccessIds,
        };
    }
}
