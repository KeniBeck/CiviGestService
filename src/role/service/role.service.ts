import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleLevel } from '@prisma/client';
import { RoleFinderService } from './role-finder.service';

/**
 * RoleService - Gestión de Roles
 *
 * Este servicio maneja las operaciones de creación, actualización y eliminación
 * de roles, respetando los niveles de permisos:
 *
 * SUPER_ADMIN:
 * - Puede crear/editar roles de cualquier nivel
 *
 * ESTATAL:
 * - Puede crear/editar roles de nivel ESTATAL y MUNICIPAL
 * - NO puede crear/editar roles SUPER_ADMIN ni OPERATIVO
 *
 * MUNICIPAL:
 * - Puede crear/editar roles de nivel MUNICIPAL y OPERATIVO
 *
 * OPERATIVO:
 * - NO puede crear/editar roles (solo consulta)
 */
@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleFinderService: RoleFinderService,
  ) {}

  /**
   * Crear un nuevo rol
   */
  async create(
    createRoleDto: CreateRoleDto,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<any> {
    // Validar que el usuario puede crear este nivel de rol
    this.validateCanManageRoleLevel(createRoleDto.level, userRoleLevel);

    // Verificar que no exista un rol con ese nombre en el mismo scope
    const existingRole = await this.checkRoleNameExists(
      createRoleDto.name,
      userSedeId,
      userSubsedeId,
    );

    if (existingRole) {
      throw new ConflictException(
        `Ya existe un rol con el nombre "${createRoleDto.name}" en este alcance`,
      );
    }

    // Crear el rol
    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        level: createRoleDto.level,
        isActive: createRoleDto.isActive ?? true,
        isGlobal: false, // Roles creados por usuarios son personalizados
        sedeId: userSedeId,
        subsedeId: userSubsedeId,
      },
    });
  }

  /**
   * Actualizar un rol existente
   */
  async update(
    id: number,
    updateRoleDto: UpdateRoleDto,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<any> {
    // Buscar el rol
    const role = await this.roleFinderService.findOne(
      id,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // VALIDACIÓN: Solo Super Admin puede editar roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden editar roles globales del sistema',
      );
    }

    // Validar que el usuario puede modificar el nivel actual del rol
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    // Si se está cambiando el nivel, validar el nuevo nivel
    if (updateRoleDto.level && updateRoleDto.level !== role.level) {
      this.validateCanManageRoleLevel(updateRoleDto.level, userRoleLevel);
    }

    // Si se está cambiando el nombre, verificar que no exista
    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.checkRoleNameExists(
        updateRoleDto.name,
        role.sedeId,
        role.subsedeId,
      );

      if (existingRole) {
        throw new ConflictException(
          `Ya existe un rol con el nombre "${updateRoleDto.name}" en este alcance`,
        );
      }
    }

    // Actualizar el rol
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  /**
   * Eliminar un rol (soft delete si es necesario o hard delete)
   * Por ahora solo desactivamos el rol
   */
  async remove(
    id: number,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<any> {
    // Buscar el rol
    const role = await this.roleFinderService.findOne(
      id,
      userRoleLevel,
      userSedeId,
      userSubsedeId,
    );

    // VALIDACIÓN: Solo Super Admin puede eliminar roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden eliminar roles globales del sistema',
      );
    }

    // Validar que el usuario puede eliminar este nivel de rol
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    // Verificar que el rol no esté en uso
    const usersWithRole = await this.prisma.userRole.count({
      where: {
        roleId: id,
        isActive: true,
      },
    });

    if (usersWithRole > 0) {
      throw new BadRequestException(
        `No se puede eliminar el rol porque está asignado a ${usersWithRole} usuario(s)`,
      );
    }

    // Desactivar el rol en lugar de eliminarlo
    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Reactivar un rol desactivado
   */
  async activate(
    id: number,
    userRoleLevel: RoleLevel,
    userSedeId: number,
    userSubsedeId: number | null,
  ): Promise<any> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    // VALIDACIÓN: Solo Super Admin puede reactivar roles globales
    if (role.isGlobal && userRoleLevel !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Solo Super Administradores pueden reactivar roles globales del sistema',
      );
    }

    // Validar acceso a roles personalizados
    this.validateRoleOwnership(role, userSedeId, userSubsedeId);

    // Validar permisos
    this.validateCanManageRoleLevel(role.level, userRoleLevel);

    return this.prisma.role.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Verificar si existe un rol con el mismo nombre en el mismo scope
   */
  private async checkRoleNameExists(
    name: string,
    sedeId: number | null,
    subsedeId: number | null,
  ): Promise<boolean> {
    const role = await this.prisma.role.findFirst({
      where: {
        name,
        sedeId,
        subsedeId,
      },
    });
    return !!role;
  }

  /**
   * Validar acceso a roles personalizados (no globales)
   */
  private validateRoleOwnership(
    role: any,
    userSedeId: number,
    userSubsedeId: number | null,
  ): void {
    // Si es un rol global, todos pueden verlo
    if (role.isGlobal) {
      return;
    }

    // Si es un rol personalizado, validar acceso
    if (role.sedeId && role.sedeId !== userSedeId) {
      throw new ForbiddenException('No tienes acceso a este rol');
    }

    if (role.subsedeId && userSubsedeId && role.subsedeId !== userSubsedeId) {
      throw new ForbiddenException('No tienes acceso a este rol');
    }
  }

  /**
   * Validar que un usuario puede gestionar un nivel de rol específico
   */
  private validateCanManageRoleLevel(
    roleLevel: RoleLevel,
    userRoleLevel: RoleLevel,
  ): void {
    // ...existing code...
  }
}

