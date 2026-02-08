import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginAgenteDto } from './dto/login-agente.dto';
import { ChangePasswordAgenteDto } from './dto/change-password-agente.dto';

@Injectable()
export class AgentesAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Login de agente
   */
  async login(loginDto: LoginAgenteDto) {
    // 1. Buscar agente por número de placa
    const agente = await this.prisma.agente.findFirst({
      where: {
        numPlaca: loginDto.numPlaca,
        isActive: true,
        deletedAt: null,
      },
      include: {
        roles: {
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
        tipo: true,
        patrulla: true,
        subsede: true,
        sede: true,
      },
    });

    if (!agente) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.contrasena,
      agente.contrasena,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Extraer permisos de los roles
    const permissions = agente.roles.flatMap((ar) =>
      ar.role.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`,
      ),
    );

    // 4. Generar JWT con secret diferente (usar campos compatibles con RequestUser)
    const payload = {
      sub: agente.id,
      email: agente.correo,
      username: agente.numPlaca,
      numPlaca: agente.numPlaca,
      sedeId: agente.sedeId,
      subsedeId: agente.subsedeId,
      accessLevel: 'OPERATIVO',
      roles: agente.roles.map((ar) => ar.role.name),
      permissions, // ✅ Usar 'permissions' en vez de 'permisos'
      isAgente: true, // ✅ Identificador crucial
      sedeAccessIds: [],
      subsedeAccessIds: [],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET_AGENTES'),
      expiresIn: '8h', // Sesión de 8 horas
    });

    // 5. Actualizar último login
    await this.prisma.agente.update({
      where: { id: agente.id },
      data: { lastLoginAt: new Date() },
    });

    // 6. Verificar si es primer login (requiere cambio de contraseña)
    const requirePasswordChange = !agente.lastLoginAt;

    // 7. Preparar roles
    const roles = agente.roles.map((ar) => ar.role.name);

    // 8. Retornar en el mismo formato que el login de usuarios normales
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 28800, // 8 horas en segundos
      user: {
        id: agente.id,
        email: agente.correo,
        username: agente.numPlaca, // numPlaca como username
        firstName: agente.nombres,
        lastName: `${agente.apellidoPaterno} ${agente.apellidoMaterno}`,
        sedeId: agente.sedeId,
        subsedeId: agente.subsedeId,
        accessLevel: 'OPERATIVO', // Agentes son nivel operativo
        roles,
        permissions, // ✅ Cambiado de 'permisos' a 'permissions'
        isAgente: true, // Identificador para el frontend
        foto: agente.foto,
        cargo: agente.cargo,
        numPlaca: agente.numPlaca,
        whatsapp: agente.whatsapp,
        tipo: agente.tipo.tipo,
        patrulla: agente.patrulla
          ? {
              id: agente.patrulla.id,
              numPatrulla: agente.patrulla.numPatrulla,
              placa: agente.patrulla.placa,
            }
          : null,
        requirePasswordChange,
      },
    };
  }

  /**
   * Cambiar contraseña del agente
   */
  async changePassword(
    agenteId: number,
    changePasswordDto: ChangePasswordAgenteDto,
  ) {
    const agente = await this.prisma.agente.findUnique({
      where: { id: agenteId },
    });

    if (!agente) {
      throw new NotFoundException('Agente no encontrado');
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      agente.contrasena,
    );

    if (!isValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Actualizar contraseña
    await this.prisma.agente.update({
      where: { id: agenteId },
      data: { contrasena: hashedPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Obtener perfil del agente autenticado
   */
  async getProfile(agenteId: number) {
    const agente = await this.prisma.agente.findUnique({
      where: { id: agenteId, isActive: true, deletedAt: null },
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
        tipo: true,
        patrulla: true,
        subsede: true,
      },
    });

    if (!agente) {
      throw new NotFoundException('Agente no encontrado');
    }

    const permisos = agente.roles.flatMap((ar) =>
      ar.role.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`,
      ),
    );

    const roles = agente.roles.map((ar) => ar.role.name);

    return {
      id: agente.id,
      email: agente.correo,
      username: agente.numPlaca,
      firstName: agente.nombres,
      lastName: `${agente.apellidoPaterno} ${agente.apellidoMaterno}`,
      sedeId: agente.sedeId,
      subsedeId: agente.subsedeId,
      accessLevel: 'SUBSEDE',
      roles,
      // Campos adicionales de agente
      isAgente: true,
      foto: agente.foto,
      cargo: agente.cargo,
      numPlaca: agente.numPlaca,
      whatsapp: agente.whatsapp,
      tipo: agente.tipo.tipo,
      patrulla: agente.patrulla,
      permisos,
    };
  }
}
