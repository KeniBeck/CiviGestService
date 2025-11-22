import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Login de usuario
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
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
        sede: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    // Validar existencia del usuario
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar estado del usuario
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Validar estado de la sede
    if (!user.sede.isActive) {
      throw new UnauthorizedException('Sede inactiva');
    }

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar última fecha de login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Extraer roles y permisos
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = this.extractPermissions(user.roles);

    // Generar token JWT
    const token = await this.generateToken(user, roles, permissions);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: parseInt(
        this.configService.get<string>('JWT_EXPIRES_IN') || '604800',
      ),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        sedeId: user.sedeId,
        subsedeId: user.subsedeId,
        accessLevel: user.accessLevel,
        roles,
      },
    };
  }

  /**
   * Registro de nuevo usuario
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Validar que el email no exista
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validar que el username no exista
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('El username ya está registrado');
    }

    // Validar que el documento no exista
    const existingDocument = await this.prisma.user.findUnique({
      where: { documentNumber: registerDto.documentNumber },
    });

    if (existingDocument) {
      throw new ConflictException('El número de documento ya está registrado');
    }

    // Validar que la sede exista y esté activa
    const sede = await this.prisma.sede.findFirst({
      where: {
        id: registerDto.sedeId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new BadRequestException('Sede no válida o inactiva');
    }

    // Validar subsede si se proporciona
    if (registerDto.subsedeId) {
      const subsede = await this.prisma.subsede.findFirst({
        where: {
          id: registerDto.subsedeId,
          sedeId: registerDto.sedeId, // Debe pertenecer a la sede del usuario
          isActive: true,
          deletedAt: null,
        },
      });

      if (!subsede) {
        throw new BadRequestException('Subsede no válida o no pertenece a la sede especificada');
      }
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        username: registerDto.username,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phoneCountryCode: registerDto.phoneCountryCode,
        phoneNumber: registerDto.phoneNumber,
        address: registerDto.address,
        documentType: registerDto.documentType,
        documentNumber: registerDto.documentNumber,
        sedeId: registerDto.sedeId,
        subsedeId: registerDto.subsedeId,
        accessLevel: registerDto.accessLevel,
        isActive: true,
      },
    });

    // Asignar rol por defecto (Usuario)
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'Usuario' },
    });

    if (defaultRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
          assignedBy: user.id, // Auto-asignado en registro
          isActive: true,
        },
      });
    }

    // Generar token para login automático
    const token = await this.generateToken(user, ['Usuario'], []);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: parseInt(
        this.configService.get<string>('JWT_EXPIRES_IN') || '604800',
      ),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        sedeId: user.sedeId,
        subsedeId: user.subsedeId,
        accessLevel: user.accessLevel,
        roles: ['Usuario'],
      },
    };
  }

  /**
   * Validar token JWT
   */
  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  /**
   * Generar token JWT
   */
  private async generateToken(
    user: any,
    roles: string[],
    permissions: string[],
  ): Promise<string> {
    // Obtener accesos explícitos a sedes
    const sedeAccess = await this.prisma.userSedeAccess.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        sedeId: true,
      },
    });

    // Obtener accesos explícitos a subsedes
    const subsedeAccess = await this.prisma.userSubsedeAccess.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        subsedeId: true,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      sedeId: user.sedeId,
      subsedeId: user.subsedeId,
      accessLevel: user.accessLevel,
      roles,
      permissions,
      sedeAccessIds: sedeAccess.map((sa) => sa.sedeId),
      subsedeAccessIds: subsedeAccess.map((ssa) => ssa.subsedeId),
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Extraer permisos únicos de los roles del usuario
   */
  private extractPermissions(userRoles: any[]): string[] {
    const permissionsSet = new Set<string>();

    userRoles.forEach((userRole) => {
      userRole.role.permissions.forEach((rolePermission: any) => {
        const permission = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
        permissionsSet.add(permission);
      });
    });

    return Array.from(permissionsSet);
  }
}
