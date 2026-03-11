import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PagosInfraccionesPaginationService } from '../../common/services/pagination/pagos-infracciones/pagos-infracciones-pagination.service';
import { FilterPagosInfraccionesDto } from '../dto/filter-pagos-infracciones.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';

@Injectable()
export class PagosInfraccionesFinderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PagosInfraccionesPaginationService,
  ) {}

  /**
   * Buscar todos los pagos con filtros y paginación
   */
  async findAll(
    filters: FilterPagosInfraccionesDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<PaginatedResponse<any>> {
    return await this.paginationService.paginatePagosInfracciones({
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
   * Buscar un pago por ID con validación de acceso
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const pago = await this.prisma.pagoInfraccion.findUnique({
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
          },
        },
        usuarioCobro: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        usuarioAutorizo: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        pagoOriginal: true,
        reembolsos: true,
      },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    // Validar acceso multi-tenant
    await this.validateAccess(pago, userSedeId, userSubsedeId, accessLevel, roles);

    return pago;
  }

  /**
   * Buscar pagos por multa ID
   */
  async findByMulta(
    multaId: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const whereClause: any = { multaId, deletedAt: null };

    // Multi-tenancy
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    return await this.prisma.pagoInfraccion.findMany({
      where: whereClause,
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        usuarioCobro: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        usuarioAutorizo: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
      orderBy: { fechaPago: 'desc' },
    });
  }

  /**
   * Buscar pagos por folio de infracción
   */
  async findByFolio(
    folioInfraccion: string,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const whereClause: any = { folioInfraccion, deletedAt: null };

    // Multi-tenancy
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        whereClause.subsedeId = userSubsedeId;
      }
    }

    return await this.prisma.pagoInfraccion.findMany({
      where: whereClause,
      include: {
        sede: { select: { id: true, name: true, code: true } },
        subsede: { select: { id: true, name: true, code: true } },
        multa: { select: { id: true, nombre: true, codigo: true } },
        usuarioCobro: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
      orderBy: { fechaPago: 'desc' },
    });
  }

  /**
   * Verificar si un folio de infracción tiene pagos activos
   */
  async hasActivePago(folioInfraccion: string): Promise<boolean> {
    const count = await this.prisma.pagoInfraccion.count({
      where: {
        folioInfraccion,
        estatus: 'PAGADO',
        deletedAt: null,
        isActive: true,
      },
    });

    return count > 0;
  }

  /**
   * Obtener estadísticas de pagos (útil para dashboards)
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
      whereClause.fechaPago = {};
      if (fechaInicio) whereClause.fechaPago.gte = fechaInicio;
      if (fechaFin) whereClause.fechaPago.lte = fechaFin;
    }

    const [totalPagos, pagosPendientes, pagosReembolsados, montoTotal] =
      await Promise.all([
        this.prisma.pagoInfraccion.count({ where: whereClause }),
        this.prisma.pagoInfraccion.count({
          where: { ...whereClause, estatus: 'PENDIENTE' },
        }),
        this.prisma.pagoInfraccion.count({
          where: { ...whereClause, estatus: 'REEMBOLSADO' },
        }),
        this.prisma.pagoInfraccion.aggregate({
          where: { ...whereClause, estatus: 'PAGADO', esReembolso: false },
          _sum: { total: true },
        }),
      ]);

    return {
      totalPagos,
      pagosPendientes,
      pagosReembolsados,
      montoTotal: montoTotal._sum.total || 0,
    };
  }

  /**
   * Validar acceso multi-tenant a un pago
   */
  private async validateAccess(
    pago: any,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ): Promise<void> {
    const isSuperAdmin = roles?.includes('Super Administrador');

    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        if (pago.sedeId !== userSedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a este pago',
          );
        }
      } else if (accessLevel === 'SUBSEDE') {
        if (pago.subsedeId !== userSubsedeId) {
          throw new ForbiddenException(
            'No tienes permisos para acceder a este pago',
          );
        }
      }
    }
  }
}
