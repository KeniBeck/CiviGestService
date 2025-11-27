import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartamentoDto } from '../dto/create-departamento.dto';
import { UpdateDepartamentoDto } from '../dto/update-departamento.dto';

/**
 * Servicio para operaciones CRUD de departamentos
 */
@Injectable()
export class DepartamentoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo departamento
   */
  async create(
    createDepartamentoDto: CreateDepartamentoDto,
    userSedeId: number,
    userSubsedeId: number | null,
    userId: number,
  ) {
    // Validar que el usuario tenga subsedeId
    if (!userSubsedeId) {
      throw new BadRequestException('El usuario debe tener una subsede asignada para crear departamentos');
    }

    // Verificar que el nombre sea único en la subsede
    const existing = await this.prisma.departamento.findFirst({
      where: {
        subsedeId: userSubsedeId,
        nombre: createDepartamentoDto.nombre,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un departamento con el nombre "${createDepartamentoDto.nombre}" en este municipio`);
    }

    // Crear el departamento
    return this.prisma.departamento.create({
      data: {
        ...createDepartamentoDto,
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
      },
    });
  }

  /**
   * Actualizar un departamento existente
   */
  async update(
    id: number,
    updateDepartamentoDto: UpdateDepartamentoDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar que el departamento existe y el usuario tiene acceso
    const departamento = await this.findOneInternal(id, userSedeId, userSubsedeId, accessLevel, roles);

    // Si se cambia el nombre, verificar unicidad
    if (updateDepartamentoDto.nombre && updateDepartamentoDto.nombre !== departamento.nombre) {
      const existing = await this.prisma.departamento.findFirst({
        where: {
          subsedeId: departamento.subsedeId,
          nombre: updateDepartamentoDto.nombre,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Ya existe un departamento con el nombre "${updateDepartamentoDto.nombre}" en este municipio`);
      }
    }

    // Actualizar
    return this.prisma.departamento.update({
      where: { id },
      data: updateDepartamentoDto,
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
      },
    });
  }

  /**
   * Eliminar (soft delete) un departamento
   */
  async remove(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    // Validar que el departamento existe y el usuario tiene acceso
    await this.findOneInternal(id, userSedeId, userSubsedeId, accessLevel, roles);

    // Soft delete
    return this.prisma.departamento.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Método interno para validar acceso y existencia
   */
  private async findOneInternal(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles.includes('super_admin');

    const whereClause: any = {
      id,
      deletedAt: null,
    };

    // Control de acceso multi-tenant
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    const departamento = await this.prisma.departamento.findFirst({
      where: whereClause,
    });

    if (!departamento) {
      throw new NotFoundException(`Departamento con ID ${id} no encontrado o sin acceso`);
    }

    return departamento;
  }
}
