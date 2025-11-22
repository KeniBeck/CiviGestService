import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationService } from '../common/services/validation.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccessLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * UserService - Gestión de Usuarios
 * 
 * Control de acceso por nivel de rol:
 * - SUPER_ADMIN: Puede gestionar cualquier usuario del sistema
 * - ESTATAL (SEDE): Puede gestionar usuarios de su sede y subsedes
 * - MUNICIPAL (SUBSEDE): Puede gestionar usuarios de su subsede
 * - OPERATIVO: No puede gestionar usuarios
 */
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  /**
   * Crear nuevo usuario
   * Validaciones por nivel:
   * - Super Admin: puede crear usuarios en cualquier sede/subsede
   * - Usuario SEDE: solo puede crear usuarios en su sede
   * - Usuario SUBSEDE: solo puede crear usuarios en su subsede
   */
  async create(
    createUserDto: CreateUserDto,
    creatorId: number,
    creatorSedeId: number,
    creatorSubsedeId: number | null,
    creatorAccessLevel: AccessLevel,
    creatorRoles: string[],
  ) {
    const isSuperAdmin = creatorRoles.includes('Super Administrador');

    // Validar que el creador tenga permisos para crear en la sede especificada
    if (!isSuperAdmin) {
      if (createUserDto.sedeId !== creatorSedeId) {
        throw new ForbiddenException(
          'No puedes crear usuarios en una sede diferente a la tuya',
        );
      }

      // Si tiene acceso SUBSEDE, solo puede crear usuarios en su subsede
      if (creatorAccessLevel === AccessLevel.SUBSEDE) {
        if (
          !createUserDto.subsedeId ||
          createUserDto.subsedeId !== creatorSubsedeId
        ) {
          throw new ForbiddenException(
            'Solo puedes crear usuarios en tu propia subsede',
          );
        }
      }
    }

    // Validaciones de unicidad usando ValidationService
    await this.validationService.validateEmailUnique(createUserDto.email);
    await this.validationService.validateUsernameUnique(createUserDto.username);
    await this.validationService.validateDocumentUnique(createUserDto.documentNumber);

    // Validar que la sede existe usando ValidationService
    await this.validationService.validateSedeExists(createUserDto.sedeId);

    // Si se especifica subsede, verificar que exista y pertenezca a la sede
    if (createUserDto.subsedeId) {
      await this.validationService.validateSubsedeExists(
        createUserDto.subsedeId,
        createUserDto.sedeId,
      );
    }

    // Verificar que los roles existan y validar permisos para asignarlos
    const roles = await this.validationService.validateRolesExist(createUserDto.roleIds);

    // Validar jerarquía de roles usando ValidationService
    this.validationService.validateRoleHierarchy(
      roles,
      creatorAccessLevel,
      isSuperAdmin,
    );

    // Validar coherencia entre accessLevel y roles
    const hasEstatalRole = roles.some(role => role.level === 'ESTATAL');
    const hasMunicipalRole = roles.some(role => role.level === 'MUNICIPAL');
    
    if (hasEstatalRole && createUserDto.accessLevel !== AccessLevel.SEDE) {
      throw new BadRequestException(
        'Un usuario con rol ESTATAL debe tener accessLevel SEDE',
      );
    }
    
    if (hasMunicipalRole && createUserDto.accessLevel !== AccessLevel.SUBSEDE) {
      throw new BadRequestException(
        'Un usuario con rol MUNICIPAL debe tener accessLevel SUBSEDE',
      );
    }

    // Validar accesos explícitos a subsedes (si se especifican)
    // SOLO usuarios ESTATAL pueden tener acceso explícito a múltiples subsedes
    if (createUserDto.subsedeAccessIds && createUserDto.subsedeAccessIds.length > 0) {
      // Validar que el usuario a crear sea nivel ESTATAL
      if (createUserDto.accessLevel !== AccessLevel.SEDE) {
        throw new BadRequestException(
          'Solo usuarios con accessLevel SEDE (ESTATAL) pueden tener accesos explícitos a subsedes',
        );
      }

      // Validar que las subsedes existan y pertenezcan a la sede usando ValidationService
      await this.validationService.validateSubsedesExist(
        createUserDto.subsedeAccessIds,
      );

      const invalidSubsedeIds = await this.validationService.validateSubsedesBelongToSede(
        createUserDto.subsedeAccessIds,
        createUserDto.sedeId,
      );
      if (invalidSubsedeIds.length > 0) {
        throw new BadRequestException(
          `Las subsedes ${invalidSubsedeIds.join(', ')} no pertenecen a la sede especificada`,
        );
      }
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      // Crear usuario en transacción
      const user = await this.prisma.$transaction(async (tx) => {
        // Crear usuario
        const newUser = await tx.user.create({
          data: {
            sedeId: createUserDto.sedeId,
            subsedeId: createUserDto.subsedeId,
            email: createUserDto.email,
            username: createUserDto.username,
            password: hashedPassword,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            phoneCountryCode: createUserDto.phoneCountryCode || '+52',
            phoneNumber: createUserDto.phoneNumber,
            address: createUserDto.address,
            documentType: createUserDto.documentType,
            documentNumber: createUserDto.documentNumber,
            accessLevel: createUserDto.accessLevel,
            createdBy: creatorId,
            isActive: true,
          },
        });

        // Asignar roles
        const userRolesData = createUserDto.roleIds.map((roleId) => ({
          userId: newUser.id,
          roleId,
          assignedBy: creatorId,
          isActive: true,
        }));

        await tx.userRole.createMany({
          data: userRolesData,
        });

        // Asignar acceso automático a su sede
        await tx.userSedeAccess.create({
          data: {
            userId: newUser.id,
            sedeId: createUserDto.sedeId,
            grantedBy: creatorId,
            isActive: true,
          },
        });

        // Asignar accesos explícitos a subsedes (si se especifican)
        // Solo usuarios ESTATAL pueden tener accesos explícitos a subsedes
        if (
          createUserDto.subsedeAccessIds &&
          createUserDto.subsedeAccessIds.length > 0
        ) {
          const subsedeAccessData = createUserDto.subsedeAccessIds.map(
            (subsedeId) => ({
              userId: newUser.id,
              subsedeId,
              grantedBy: creatorId,
              isActive: true,
            }),
          );

          await tx.userSubsedeAccess.createMany({
            data: subsedeAccessData,
          });
        }

        return newUser;
      });

      // Retornar usuario con relaciones
      return this.findOne(
        user.id,
        creatorId,
        creatorSedeId,
        creatorSubsedeId,
        creatorAccessLevel,
        creatorRoles,
        [], // sedeAccessIds - nuevo usuario no tiene accesos explícitos aún
        [], // subsedeAccessIds - nuevo usuario no tiene accesos explícitos aún
      );
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Error de duplicado en campos únicos');
      }
      throw error;
    }
  }

  /**
   * Buscar un usuario por ID con validaciones de acceso
   */
  async findOne(
    id: number,
    userId: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
    sedeAccessIds: number[],
    subsedeAccessIds: number[],
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        sede: true,
        subsede: true,
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
        sedeAccess: {
          where: { isActive: true },
          include: {
            sede: true,
          },
        },
        subsedeAccess: {
          where: { isActive: true },
          include: {
            subsede: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const isSuperAdmin = roles.includes('Super Administrador');

    // Validar acceso
    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        const accessibleSedeIds = [userSedeId, ...sedeAccessIds];
        if (!accessibleSedeIds.includes(user.sedeId)) {
          throw new ForbiddenException('No tienes acceso a este usuario');
        }
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(userSubsedeId ? [userSubsedeId] : []),
          ...subsedeAccessIds,
        ];
        if (!user.subsedeId || !accessibleSubsedeIds.includes(user.subsedeId)) {
          throw new ForbiddenException('No tienes acceso a este usuario');
        }
      } else {
        throw new ForbiddenException('No tienes permisos para ver usuarios');
      }
    }

    return user;
  }

  /**
   * Actualizar usuario
   * Validaciones por nivel:
   * - Super Admin: puede actualizar cualquier usuario
   * - Usuario SEDE: solo usuarios de su sede
   * - Usuario SUBSEDE: solo usuarios de su subsede
   */
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    updaterId: number,
    updaterSedeId: number,
    updaterSubsedeId: number | null,
    updaterAccessLevel: AccessLevel,
    updaterRoles: string[],
    sedeAccessIds: number[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = updaterRoles.includes('Super Administrador');

    // Buscar usuario a actualizar
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Validar permisos de actualización
    if (!isSuperAdmin) {
      if (updaterAccessLevel === AccessLevel.SEDE) {
        const accessibleSedeIds = [updaterSedeId, ...sedeAccessIds];
        if (!accessibleSedeIds.includes(existingUser.sedeId)) {
          throw new ForbiddenException('No tienes acceso para actualizar este usuario');
        }
      } else if (updaterAccessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(updaterSubsedeId ? [updaterSubsedeId] : []),
          ...subsedeAccessIds,
        ];
        if (
          !existingUser.subsedeId ||
          !accessibleSubsedeIds.includes(existingUser.subsedeId)
        ) {
          throw new ForbiddenException('No tienes acceso para actualizar este usuario');
        }
      } else {
        throw new ForbiddenException('No tienes permisos para actualizar usuarios');
      }
    }

    // Validar email único (si se cambia) usando ValidationService
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      await this.validationService.validateEmailUnique(updateUserDto.email, id);
    }

    // Validar username único (si se cambia) usando ValidationService
    if (updateUserDto.username && updateUserDto.username !== existingUser.username) {
      await this.validationService.validateUsernameUnique(updateUserDto.username, id);
    }

    // Validar documento único (si se cambia) usando ValidationService
    if (updateUserDto.documentNumber && updateUserDto.documentNumber !== existingUser.documentNumber) {
      await this.validationService.validateDocumentUnique(updateUserDto.documentNumber, id);
    }

    // Validar subsede (si se cambia) usando ValidationService
    if (updateUserDto.subsedeId && updateUserDto.subsedeId !== existingUser.subsedeId) {
      await this.validationService.validateSubsedeExists(
        updateUserDto.subsedeId,
        existingUser.sedeId, // Debe pertenecer a la misma sede
      );
    }

    // Validar accesos explícitos a subsedes (si se especifican)
    // Solo usuarios ESTATAL pueden tener acceso explícito a múltiples subsedes
    if (updateUserDto.subsedeAccessIds !== undefined && updateUserDto.subsedeAccessIds.length > 0) {
      // Validar que las subsedes existan y pertenezcan a la sede usando ValidationService
      await this.validationService.validateSubsedesExist(
        updateUserDto.subsedeAccessIds,
      );

      const invalidSubsedeIds = await this.validationService.validateSubsedesBelongToSede(
        updateUserDto.subsedeAccessIds,
        existingUser.sedeId,
      );

      if (invalidSubsedeIds.length > 0) {
        throw new BadRequestException(
          `Las subsedes ${invalidSubsedeIds.join(', ')} no pertenecen a la sede del usuario`,
        );
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Actualizar datos básicos del usuario
        const updatedUser = await tx.user.update({
          where: { id },
          data: {
            email: updateUserDto.email,
            username: updateUserDto.username,
            firstName: updateUserDto.firstName,
            lastName: updateUserDto.lastName,
            phoneCountryCode: updateUserDto.phoneCountryCode,
            phoneNumber: updateUserDto.phoneNumber,
            address: updateUserDto.address,
            documentType: updateUserDto.documentType,
            documentNumber: updateUserDto.documentNumber,
            subsedeId: updateUserDto.subsedeId,
            accessLevel: updateUserDto.accessLevel,
          },
        });

        // Actualizar roles (si se especifican)
        if (updateUserDto.roleIds && updateUserDto.roleIds.length > 0) {
          // Validar que los roles existan usando ValidationService
          const roles = await this.validationService.validateRolesExist(
            updateUserDto.roleIds,
          );

          // Validar jerarquía de roles usando ValidationService
          this.validationService.validateRoleHierarchy(
            roles,
            updaterAccessLevel,
            isSuperAdmin,
          );

          // Desactivar roles actuales
          await tx.userRole.updateMany({
            where: { userId: id },
            data: { isActive: false },
          });

          // Crear nuevos roles
          const userRolesData = updateUserDto.roleIds.map((roleId) => ({
            userId: id,
            roleId,
            assignedBy: updaterId,
            isActive: true,
          }));

          await tx.userRole.createMany({
            data: userRolesData,
          });
        }

        // Actualizar accesos a subsedes (si se especifican)
        if (updateUserDto.subsedeAccessIds !== undefined) {
          // Desactivar accesos actuales
          await tx.userSubsedeAccess.updateMany({
            where: { userId: id },
            data: { isActive: false },
          });

          // Crear nuevos accesos
          if (updateUserDto.subsedeAccessIds.length > 0) {
            const subsedeAccessData = updateUserDto.subsedeAccessIds.map(
              (subsedeId) => ({
                userId: id,
                subsedeId,
                grantedBy: updaterId,
                isActive: true,
              }),
            );

            await tx.userSubsedeAccess.createMany({
              data: subsedeAccessData,
            });
          }
        }

        return updatedUser;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Error de duplicado en campos únicos');
      }
      throw error;
    }
  }

  /**
   * Soft delete de usuario
   * Validaciones por nivel:
   * - Super Admin: puede eliminar cualquier usuario
   * - Usuario SEDE: solo usuarios de su sede
   * - Usuario SUBSEDE: solo usuarios de su subsede
   */
  async remove(
    id: number,
    deleterId: number,
    deleterSedeId: number,
    deleterSubsedeId: number | null,
    deleterAccessLevel: AccessLevel,
    deleterRoles: string[],
    sedeAccessIds: number[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = deleterRoles.includes('Super Administrador');

    // Buscar usuario
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Validar permisos de eliminación
    if (!isSuperAdmin) {
      if (deleterAccessLevel === AccessLevel.SEDE) {
        const accessibleSedeIds = [deleterSedeId, ...sedeAccessIds];
        if (!accessibleSedeIds.includes(user.sedeId)) {
          throw new ForbiddenException('No tienes acceso para eliminar este usuario');
        }
      } else if (deleterAccessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(deleterSubsedeId ? [deleterSubsedeId] : []),
          ...subsedeAccessIds,
        ];
        if (
          !user.subsedeId ||
          !accessibleSubsedeIds.includes(user.subsedeId)
        ) {
          throw new ForbiddenException('No tienes acceso para eliminar este usuario');
        }
      } else {
        throw new ForbiddenException('No tienes permisos para eliminar usuarios');
      }
    }

    // No permitir eliminar el propio usuario
    if (id === deleterId) {
      throw new BadRequestException('No puedes eliminar tu propio usuario');
    }

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Activar/desactivar usuario
   * Validaciones por nivel:
   * - Super Admin: puede cambiar estado de cualquier usuario
   * - Usuario SEDE: solo usuarios de su sede
   * - Usuario SUBSEDE: solo usuarios de su subsede
   */
  async toggleActive(
    id: number,
    updaterId: number,
    updaterSedeId: number,
    updaterSubsedeId: number | null,
    updaterAccessLevel: AccessLevel,
    updaterRoles: string[],
    sedeAccessIds: number[],
    subsedeAccessIds: number[],
  ) {
    const isSuperAdmin = updaterRoles.includes('Super Administrador');

    // Buscar usuario
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Validar permisos
    if (!isSuperAdmin) {
      if (updaterAccessLevel === AccessLevel.SEDE) {
        const accessibleSedeIds = [updaterSedeId, ...sedeAccessIds];
        if (!accessibleSedeIds.includes(user.sedeId)) {
          throw new ForbiddenException('No tienes acceso para cambiar el estado de este usuario');
        }
      } else if (updaterAccessLevel === AccessLevel.SUBSEDE) {
        const accessibleSubsedeIds = [
          ...(updaterSubsedeId ? [updaterSubsedeId] : []),
          ...subsedeAccessIds,
        ];
        if (
          !user.subsedeId ||
          !accessibleSubsedeIds.includes(user.subsedeId)
        ) {
          throw new ForbiddenException('No tienes acceso para cambiar el estado de este usuario');
        }
      } else {
        throw new ForbiddenException('No tienes permisos para gestionar usuarios');
      }
    }

    // No permitir desactivar el propio usuario
    if (id === updaterId && user.isActive) {
      throw new BadRequestException('No puedes desactivar tu propio usuario');
    }

    // Cambiar estado
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
    });
  }
}
