import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestUser } from '../interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessLevel } from '@prisma/client';

/**
 * Tenant Access Guard
 * Valida que el usuario tenga acceso al tenant, sede o subsede solicitado
 */
@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Extraer IDs de los parámetros, query o body
    const tenantId = this.extractId(request, 'tenantId');
    const sedeId = this.extractId(request, 'sedeId');
    const subsedeId = this.extractId(request, 'subsedeId');

    // Validar acceso al tenant
    if (tenantId && tenantId !== user.tenantId) {
      throw new ForbiddenException(
        'No tienes acceso a este tenant',
      );
    }

    // Si el usuario tiene acceso a TODO el tenant, permitir
    if (user.accessLevel === AccessLevel.TENANT) {
      return true;
    }

    // Validar acceso a sede
    if (sedeId && user.accessLevel === AccessLevel.SEDE) {
      const hasAccess = await this.prisma.userSedeAccess.findFirst({
        where: {
          userId: user.id,
          sedeId: sedeId,
          isActive: true,
        },
      });

      if (!hasAccess) {
        throw new ForbiddenException(
          'No tienes acceso a esta sede',
        );
      }
    }

    // Validar acceso a subsede
    if (subsedeId && user.accessLevel === AccessLevel.SUBSEDE) {
      const hasAccess = await this.prisma.userSubsedeAccess.findFirst({
        where: {
          userId: user.id,
          subsedeId: subsedeId,
          isActive: true,
        },
      });

      if (!hasAccess) {
        throw new ForbiddenException(
          'No tienes acceso a esta subsede',
        );
      }
    }

    return true;
  }

  /**
   * Extrae un ID de los parámetros, query o body
   */
  private extractId(request: any, key: string): number | null {
    const value =
      request.params?.[key] || request.query?.[key] || request.body?.[key];
    return value ? parseInt(value, 10) : null;
  }
}
