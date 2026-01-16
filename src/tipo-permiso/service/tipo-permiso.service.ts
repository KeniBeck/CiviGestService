import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AccessLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTipoPermisoDto } from '../dto/create-tipo-permiso.dto';
import { UpdateTipoPermisoDto } from '../dto/update-tipo-permiso.dto';

/**
 * TipoPermisoService - Servicio de gestión de tipos de permiso
 * 
 * IMPORTANTE: Multi-tenancy estricto
 * - sedeId y subsedeId se toman del usuario autenticado
 * - Usuarios solo operan en su subsede (municipio)
 * - Nombre único por subsede (municipio)
 */
@Injectable()
export class TipoPermisoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear nuevo tipo de permiso
   * - sedeId y subsedeId se toman del usuario autenticado
   * - Valida nombre único dentro de la subsede
   */
  async create(
    createTipoPermisoDto: CreateTipoPermisoDto,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ) {
    // Validar que el usuario tiene subsedeId
    if (!userSubsedeId) {
      throw new BadRequestException(
        'El usuario debe tener una subsede asignada para crear tipos de permiso',
      );
    }

    // Verificar nombre único en la subsede
    const existingTipoPermiso = await this.prisma.tipoPermiso.findFirst({
      where: {
        subsedeId: userSubsedeId,
        nombre: createTipoPermisoDto.nombre,
        deletedAt: null,
      },
    });

    if (existingTipoPermiso) {
      throw new ConflictException(
        `Ya existe un tipo de permiso con el nombre "${createTipoPermisoDto.nombre}" en este municipio`,
      );
    }

    // Establecer vigenciaDefecto si no se proporcionó
    const vigenciaDefecto = createTipoPermisoDto.vigenciaDefecto || 365;

    // Crear tipo de permiso
    return this.prisma.tipoPermiso.create({
      data: {
        ...createTipoPermisoDto,
        vigenciaDefecto,
        sedeId: userSedeId,
        subsedeId: userSubsedeId,
        createdBy: userId,
      },
      include: {
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            permisos: true,
          },
        },
      },
    });
  }

  /**
   * Obtener un tipo de permiso por ID
   * - Valida acceso según nivel de tenant
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir where clause según acceso
    const whereClause: any = {
      id,
      deletedAt: null,
    };

    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    const tipoPermiso = await this.prisma.tipoPermiso.findFirst({
      where: whereClause,
      include: {
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        permisos: {
          where: { deletedAt: null },
          take: 5,
          select: {
            id: true,
            folio: true,
            nombreCiudadano: true,
            estatus: true,
            fechaEmision: true,
            fechaVencimiento: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tipoPermiso) {
      throw new NotFoundException(
        `Tipo de permiso con ID ${id} no encontrado o no tiene acceso`,
      );
    }

    return tipoPermiso;
  }

  /**
   * Actualizar tipo de permiso
   * - Valida que el tipo de permiso pertenece a la subsede del usuario
   * - Si se cambia el nombre, valida unicidad
   */
  async update(
    id: number,
    updateTipoPermisoDto: UpdateTipoPermisoDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    // Obtener tipo de permiso existente con validación de acceso
    const tipoPermiso = await this.findOne(
      id,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    );

    // Si se actualiza el nombre, verificar unicidad
    if (
      updateTipoPermisoDto.nombre &&
      updateTipoPermisoDto.nombre !== tipoPermiso.nombre
    ) {
      const existingTipoPermiso = await this.prisma.tipoPermiso.findFirst({
        where: {
          subsedeId: tipoPermiso.subsedeId,
          nombre: updateTipoPermisoDto.nombre,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (existingTipoPermiso) {
        throw new ConflictException(
          `Ya existe un tipo de permiso con el nombre "${updateTipoPermisoDto.nombre}" en este municipio`,
        );
      }
    }

    // Actualizar tipo de permiso
    return this.prisma.tipoPermiso.update({
      where: { id },
      data: updateTipoPermisoDto,
      include: {
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            permisos: true,
          },
        },
      },
    });
  }

  /**
   * Eliminar tipo de permiso (soft delete)
   * - Valida que no tenga permisos activos asociados
   */
  async remove(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    // Validar acceso con findOne
    await this.findOne(id, userSedeId, userSubsedeId, accessLevel, roles);

    // Verificar que no tenga permisos activos asociados
    const permisosCount = await this.prisma.permiso.count({
      where: {
        tipoPermisoId: id,
        deletedAt: null,
      },
    });

    if (permisosCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el tipo de permiso porque tiene ${permisosCount} permiso(s) asociado(s)`,
      );
    }

    // Soft delete
    return this.prisma.tipoPermiso.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
