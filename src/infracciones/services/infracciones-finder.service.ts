import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InfraccionesPaginationService } from '../../common/services/pagination/infracciones/infracciones-pagination.service';
import { FilterInfraccionesDto } from '../dto/filter-infracciones.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';

@Injectable()
export class InfraccionesFinderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: InfraccionesPaginationService,
  ) {}

  /**
   * Buscar todas las infracciones con filtros y paginación
   */
  async findAll(
    filters: FilterInfraccionesDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<PaginatedResponse<any>> {
    return await this.paginationService.paginateInfracciones({
      prisma: this.prisma,
      page: filters.page || 1,
      limit: filters.limit || 10,
      filters,
      activatePaginated: true,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    });
  }

  /**
   * Buscar una infracción por ID con validación de acceso
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const infraccion = await this.prisma.infraccion.findUnique({
      where: { id, deletedAt: null },
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        multa: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            descripcion: true,
            costo: true,
            numUMAs: true,
            numSalarios: true,
          },
        },
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            numPlaca: true,
            correo: true,
          },
        },
        pagos: {
          where: { isActive: true },
          select: {
            id: true,
            total: true,
            metodoPago: true,
            estatus: true,
            fechaPago: true,
          },
        },
      },
    });

    if (!infraccion) {
      throw new NotFoundException(`Infracción con ID ${id} no encontrada`);
    }

    // Validar acceso multi-tenant
    await this.validateAccess(infraccion, userSedeId, userSubsedeId, accessLevel, roles);

    return infraccion;
  }

  /**
   * Buscar infracciones por folio
   */
  async findByFolio(
    folio: string,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const whereClause: any = { folio, deletedAt: null };

    // Multi-tenancy
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    return await this.prisma.infraccion.findUnique({
      where: whereClause,
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        multa: { select: { id: true, nombre: true, codigo: true } },
        agente: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
          },
        },
        pagos: {
          where: { isActive: true },
          select: {
            id: true,
            total: true,
            estatus: true,
            fechaPago: true,
          },
        },
      },
    });
  }

  /**
   * Buscar infracciones por documento de ciudadano
   */
  async findByDocumento(
    documentoCiudadano: string,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const whereClause: any = { documentoCiudadano, deletedAt: null };

    // Multi-tenancy
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    return await this.prisma.infraccion.findMany({
      where: whereClause,
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        multa: { select: { id: true, nombre: true, codigo: true } },
        pagos: {
          where: { isActive: true },
          select: {
            id: true,
            total: true,
            estatus: true,
          },
        },
      },
      orderBy: { fechaInfraccion: 'desc' },
    });
  }

  /**
   * Obtener estadísticas de infracciones (útil para dashboards)
   */
  async getStatistics(
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
    fechaInicio?: Date,
    fechaFin?: Date,
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const whereClause: any = { deletedAt: null };

    // Multi-tenancy
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    // Filtro por fechas
    if (fechaInicio || fechaFin) {
      whereClause.fechaInfraccion = {};
      if (fechaInicio) whereClause.fechaInfraccion.gte = fechaInicio;
      if (fechaFin) whereClause.fechaInfraccion.lte = fechaFin;
    }

    const [totalInfracciones, levantadas, pagadas, canceladas, vencidas] =
      await Promise.all([
        this.prisma.infraccion.count({ where: whereClause }),
        this.prisma.infraccion.count({
          where: { ...whereClause, estatus: 'LEVANTADA' },
        }),
        this.prisma.infraccion.count({
          where: { ...whereClause, estatus: 'PAGADA' },
        }),
        this.prisma.infraccion.count({
          where: { ...whereClause, estatus: 'CANCELADA' },
        }),
        this.prisma.infraccion.count({
          where: {
            ...whereClause,
            estatus: 'LEVANTADA',
            fechaLimitePago: { lt: new Date() },
          },
        }),
      ]);

    return {
      totalInfracciones,
      levantadas,
      pagadas,
      canceladas,
      vencidas,
    };
  }

  /**
   * Validar acceso multi-tenant a una infracción
   */
  private async validateAccess(
    infraccion: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<void> {
    const isSuperAdmin = roles?.includes('Super Administrador');

    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        if (infraccion.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a esta infracción',
          );
        }
      } else if (accessLevel === 'SUBSEDE') {
        if (infraccion.subsedeId !== userSubsedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a esta infracción',
          );
        }
      }
    }
  }
}
