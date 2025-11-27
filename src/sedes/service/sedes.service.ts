import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubsedesService } from '../../sudsedes/service/sudsedes.service';
import { ValidationService } from '../../common/services/validation.service';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';
import { AccessLevel } from '@prisma/client';

/**
 * SedesService - Gestión de Sedes (Estados)
 * 
 * IMPORTANTE: Sede representa el ESTADO (nivel superior jerárquico)
 * - Super Admin (CiviGest) puede crear sedes
 * - Las sedes contienen subsedes (municipios)
 * - Los usuarios se crean de forma independiente
 */
@Injectable()
export class SedesService {
  constructor(
    private prisma: PrismaService,
    private subsedesService: SubsedesService,
    private validationService: ValidationService,
  ) {}

  /**
   * Crear nueva sede (departamento/cliente)
   * Solo usuarios SUPER_ADMIN pueden crear sedes
   */
  async create(createSedeDto: CreateSedeDto, userId: number) {
    // Evitar que un `id` enviado en el DTO provoque conflicto con la PK
    const { id, subsedes, ...sedeData } = createSedeDto as any;

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

    try {
      // Crear la sede (Estado)
      const sede = await this.prisma.sede.create({
        data: {
          ...sedeData,
          createdBy: userId,
        },
        include: {
          configuraciones: {
            select: {
              nombreCliente: true,
              logo: true,
            },
          },
          _count: {
            select: {
              subsedes: true,
            },
          },
        },
      });

      // Si hay subsedes (municipios), crearlas usando el servicio de Subsedes
      // Cada subsede creará su propio usuario administrador MUNICIPAL
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

      // Retornar sede con subsedes creadas
      return {
        ...sede,
        subsedes: createdSubsedes,
        _count: {
          subsedes: createdSubsedes.length,
          users: 0,
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

    // Actualizar la sede (excluir subsedes del update)
    const { subsedes: _, ...dataToUpdate } = updateSedeDto as any;
    
    return this.prisma.sede.update({
      where: { id },
      data: dataToUpdate,
      include: {
        configuraciones: {
          select: {
            nombreCliente: true,
            logo: true,
          },
        },
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
