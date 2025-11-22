import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubsedesService } from '../../sudsedes/service/sudsedes.service';
import { UserService } from '../../user/user.service';
import { ValidationService } from '../../common/services/validation.service';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';
import { AccessLevel } from '@prisma/client';

/**
 * SedesService - Gestión de Sedes (Departamentos/Clientes)
 * 
 * IMPORTANTE: Sede es el nivel superior en CiviGest
 * - Representa al departamento/cliente que contrata el servicio
 * - Solo SUPER_ADMIN puede crear nuevas Sedes
 * - Los usuarios pertenecen a una Sede, no a un Tenant
 */
@Injectable()
export class SedesService {
  constructor(
    private prisma: PrismaService,
    private subsedesService: SubsedesService,
    private userService: UserService,
    private validationService: ValidationService,
  ) {}

  /**
   * Crear nueva sede (departamento/cliente)
   * Solo usuarios SUPER_ADMIN pueden crear sedes
   */
  async create(createSedeDto: CreateSedeDto, userId: number) {
    // Evitar que un `id` enviado en el DTO provoque conflicto con la PK
    const { id, subsedes, ...sedeData } = createSedeDto as any;

    // Buscar rol "Administrador Estatal" automáticamente
    const adminRole = await this.prisma.role.findFirst({
      where: {
        name: 'Administrador Estatal',
        isActive: true,
      },
    });

    if (!adminRole) {
      throw new BadRequestException(
        'No se encontró el rol "Administrador Estatal". Debe crear este rol primero',
      );
    }

    // Verificar que no exista una sede con el mismo código
    const existingSede = await this.prisma.sede.findFirst({
      where: {
        code: sedeData.code,
        deletedAt: null,
      },
    });

    if (existingSede) {
      throw new ConflictException(
        `Ya existe una sede con el código ${sedeData.code}`,
      );
    }

    // Verificar que el email no esté en uso
    const existingEmail = await this.prisma.sede.findFirst({
      where: {
        email: sedeData.email,
        deletedAt: null,
      },
    });

    if (existingEmail) {
      throw new ConflictException(
        `Ya existe una sede con el email ${sedeData.email}`,
      );
    }

    // Si hay subsedes, validar códigos únicos
    if (subsedes && subsedes.length > 0) {
      const codes = subsedes.map((s: any) => s.code);
      const uniqueCodes = new Set(codes);
      
      if (codes.length !== uniqueCodes.size) {
        throw new ConflictException(
          'No pueden haber subsedes con códigos duplicados',
        );
      }
    }

    // Validar que el tema existe (si se proporciona)
    if (sedeData.themeId) {
      await this.validationService.validateThemeExists(sedeData.themeId);
    }

    // Generar datos del usuario administrador basados en la sede
    const adminUsername = sedeData.email.split('@')[0]; // Extraer parte antes del @
    const adminPassword = `${sedeData.code}Admin123!`; // Código de sede + Admin123!
    const adminDocumentNumber = `${sedeData.code}${Date.now().toString().slice(-10)}`; // Código + timestamp

    // Preparar datos para crear la sede
    const createData = {
      ...sedeData,
      createdBy: userId,
      latitude: sedeData.latitude
        ? parseFloat(sedeData.latitude)
        : null,
      longitude: sedeData.longitude
        ? parseFloat(sedeData.longitude)
        : null,
    };

    try {
      // Crear la sede
      const sede = await this.prisma.sede.create({
        data: createData,
      });

      // Crear usuario administrador ESTATAL para la sede
      const adminUser = await this.userService.create(
        {
          sedeId: sede.id,
          subsedeId: undefined, // Usuario ESTATAL no tiene subsede
          email: sedeData.email, // Usar email de la sede
          username: adminUsername, // Generado del email
          password: adminPassword, // Generado automáticamente
          firstName: sedeData.name, // Usar nombre de la sede
          lastName: 'Administrador', // Apellido genérico
          phoneCountryCode: sedeData.phoneCountryCode || '+52',
          phoneNumber: sedeData.phoneNumber, // Usar teléfono de la sede
          address: sedeData.address, // Usar dirección de la sede
          documentType: 'RFC', // RFC por defecto para instituciones
          documentNumber: adminDocumentNumber, // Generado automáticamente
          accessLevel: AccessLevel.SEDE, // Usuario ESTATAL
          roleIds: [adminRole.id], // Rol ESTATAL
        },
        userId, // Super Admin que crea la sede
        sede.id, // sedeId
        null, // subsedeId
        AccessLevel.SEDE, // Super Admin tiene nivel SEDE
        ['Super Administrador'], // roles del creador
      );

      // Si hay subsedes, crearlas usando el servicio de Subsedes
      let createdSubsedes: any[] = [];
      if (subsedes && subsedes.length > 0) {
        for (const subsedeData of subsedes) {
          const subsede = await this.subsedesService.create(
            {
              sedeId: sede.id,
              name: subsedeData.name,
              code: subsedeData.code,
            },
            userId,
            sede.id,
            AccessLevel.SEDE,
            ['Super Administrador'],
          );
          createdSubsedes.push(subsede);
        }
      }

      // Retornar sede con subsedes y usuario admin creados
      return {
        ...sede,
        subsedes: createdSubsedes,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          username: adminUser.username,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          temporaryPassword: adminPassword, // Retornar contraseña temporal
        },
        _count: {
          subsedes: createdSubsedes.length,
          users: 1,
        },
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const field = error?.meta?.target?.[0] || 'campo único';
        throw new ConflictException(
          `Conflicto al crear la sede: ${field} ya existe`,
        );
      }
      throw error;
    }
  }

  /**
   * Actualizar sede
   * Solo SUPER_ADMIN o usuarios con permisos específicos pueden actualizar
   */
  async update(
    id: number,
    updateSedeDto: UpdateSedeDto,
    userSedeId: number,
    accessLevel: AccessLevel,
    userId: number,
    roles?: string[],
  ) {
    // Verificar que la sede existe
    const sede = await this.prisma.sede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }

    // Si es Super Administrador, puede actualizar cualquier sede
    const isSuperAdmin = roles?.includes('Super Administrador');
    
    if (!isSuperAdmin) {
      // Validar acceso (solo puede actualizar su propia sede o con acceso explícito)
      if (accessLevel === AccessLevel.SEDE) {
        if (id !== userSedeId) {
          const hasAccess = await this.prisma.userSedeAccess.findFirst({
            where: {
              userId,
              sedeId: id,
              isActive: true,
            },
          });

          if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso para actualizar esta sede');
          }
        }
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        throw new ForbiddenException('No tienes permisos para actualizar sedes');
      }
    }

    // Si se cambia el código, verificar que no exista otro con ese código
    if (updateSedeDto.code && updateSedeDto.code !== sede.code) {
      const existingSede = await this.prisma.sede.findFirst({
        where: {
          code: updateSedeDto.code,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingSede) {
        throw new ConflictException(
          `Ya existe una sede con el código ${updateSedeDto.code}`,
        );
      }
    }

    // Si se cambia el email, verificar que no esté en uso
    if (updateSedeDto.email && updateSedeDto.email !== sede.email) {
      const existingEmail = await this.prisma.sede.findFirst({
        where: {
          email: updateSedeDto.email,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingEmail) {
        throw new ConflictException(
          `Ya existe una sede con el email ${updateSedeDto.email}`,
        );
      }
    }

    // Validar que el tema existe si se está actualizando
    if (updateSedeDto.themeId !== undefined) {
      if (updateSedeDto.themeId === null) {
        // Se está removiendo el tema, permitido
      } else {
        // Validar que el tema existe y puede ser usado por esta sede
        await this.validationService.validateThemeExists(updateSedeDto.themeId, id);
      }
    }

    // Actualizar la sede (excluir subsedes del update)
    const { subsedes: _, ...dataToUpdate } = updateSedeDto as any;
    
    return this.prisma.sede.update({
      where: { id },
      data: {
        ...dataToUpdate,
        latitude: updateSedeDto.latitude
          ? parseFloat(updateSedeDto.latitude)
          : undefined,
        longitude: updateSedeDto.longitude
          ? parseFloat(updateSedeDto.longitude)
          : undefined,
      },
      include: {
        _count: {
          select: {
            subsedes: true,
            users: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete de una sede
   * Solo SUPER_ADMIN pueden eliminar sedes
   */
  async remove(id: number) {
    const sede = await this.prisma.sede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }

    // Soft delete
    return this.prisma.sede.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Activar/Desactivar sede
   * Solo SUPER_ADMIN pueden cambiar el estado
   */
  async toggleActive(id: number) {
    const sede = await this.prisma.sede.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!sede) {
      throw new NotFoundException(`Sede con ID ${id} no encontrada`);
    }

    return this.prisma.sede.update({
      where: { id },
      data: {
        isActive: !sede.isActive,
      },
    });
  }
}
