import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardFiltersDto } from '../dto/dashboard-filters.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener métricas principales (Cards/KPIs)
   * - Total de registros principales
   * - Métricas generales según el rol del usuario
   */
  async getMainMetrics(
    filters: DashboardFiltersDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const isAdminEstatal = roles?.includes('Administrador Estatal');

    // Construir whereClause base para multi-tenancy
    const baseWhere = this.buildBaseWhere(
      isSuperAdmin,
      accessLevel,
      userSedeId,
      userSubsedeId,
      filters,
    );

    // Obtener métricas según el rol
    if (isSuperAdmin) {
      return this.getSuperAdminMetrics(baseWhere, filters);
    } else if (isAdminEstatal || accessLevel === 'SEDE') {
      return this.getSedeAdminMetrics(baseWhere, filters, userSedeId);
    } else {
      return this.getSubsedeMetrics(baseWhere, filters, userSubsedeId);
    }
  }

  /**
   * Obtener datos para gráficos de tendencias (líneas)
   * - Infracciones por mes
   * - Pagos por mes
   * - Permisos por mes
   */
  async getTrendData(
    filters: DashboardFiltersDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const baseWhere = this.buildBaseWhere(
      isSuperAdmin,
      accessLevel,
      userSedeId,
      userSubsedeId,
      filters,
    );

    const { fechaInicio, fechaFin } = this.getDateRange(filters);

    // Obtener datos agrupados por mes
    const [infraccionesPorMes, pagosPorMes, permisosPorMes] = await Promise.all([
      this.getInfraccionesPorMes(baseWhere, fechaInicio, fechaFin),
      this.getPagosPorMes(baseWhere, fechaInicio, fechaFin),
      this.getPermisosPorMes(baseWhere, fechaInicio, fechaFin),
    ]);

    return {
      infracciones: infraccionesPorMes,
      pagos: pagosPorMes,
      permisos: permisosPorMes,
    };
  }

  /**
   * Obtener distribuciones y comparativas (gráficos circulares/barras)
   * - Infracciones por tipo
   * - Pagos por método
   * - Permisos por estado
   * - Top municipios (para Super Admin y Admin Estatal)
   */
  async getDistributionData(
    filters: DashboardFiltersDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: string,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');
    const isAdminEstatal = roles?.includes('Administrador Estatal');

    const baseWhere = this.buildBaseWhere(
      isSuperAdmin,
      accessLevel,
      userSedeId,
      userSubsedeId,
      filters,
    );

    const [
      infraccionesPorTipo,
      pagosPorMetodo,
      permisosPorEstado,
      topMunicipios,
    ] = await Promise.all([
      this.getInfraccionesPorTipo(baseWhere),
      this.getPagosPorMetodo(baseWhere),
      this.getPermisosPorEstado(baseWhere),
      isSuperAdmin || isAdminEstatal
        ? this.getTopMunicipios(baseWhere, userSedeId, isSuperAdmin)
        : Promise.resolve([]),
    ]);

    return {
      infraccionesPorTipo,
      pagosPorMetodo,
      permisosPorEstado,
      ...(topMunicipios.length > 0 && { topMunicipios }),
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS - MÉTRICAS PRINCIPALES
  // ============================================

  /**
   * Métricas para Super Administrador
   */
  private async getSuperAdminMetrics(baseWhere: any, filters: DashboardFiltersDto) {
    const [
      totalSedes,
      totalSubsedes,
      totalUsuarios,
      totalInfracciones,
      totalPagosInfracciones,
      totalPermisos,
      totalPagosPermisos,
      montoTotalInfracciones,
      montoTotalPermisos,
    ] = await Promise.all([
      this.prisma.sede.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.subsede.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      this.prisma.infraccion.count({ where: { ...baseWhere.infraccion } }),
      this.prisma.pagoInfraccion.count({ where: { ...baseWhere.pagoInfraccion } }),
      this.prisma.permiso.count({ where: { ...baseWhere.permiso } }),
      this.prisma.pagoPermiso.count({ where: { ...baseWhere.pagoPermiso } }),
      this.prisma.pagoInfraccion.aggregate({
        where: { ...baseWhere.pagoInfraccion, estatus: 'PAGADO' },
        _sum: { total: true },
      }),
      this.prisma.pagoPermiso.aggregate({
        where: { ...baseWhere.pagoPermiso, estatus: 'PAGADO' },
        _sum: { total: true },
      }),
    ]);

    return {
      organizacion: {
        totalSedes,
        totalSubsedes,
        totalUsuarios,
      },
      infracciones: {
        total: totalInfracciones,
        pagadas: await this.prisma.infraccion.count({
          where: { ...baseWhere.infraccion, estatus: 'PAGADA' },
        }),
        pendientes: await this.prisma.infraccion.count({
          where: { ...baseWhere.infraccion, estatus: 'LEVANTADA' },
        }),
      },
      permisos: {
        total: totalPermisos,
        aprobados: await this.prisma.permiso.count({
          where: { ...baseWhere.permiso, estatus: 'APROBADO' },
        }),
        pendientes: await this.prisma.permiso.count({
          where: { ...baseWhere.permiso, estatus: 'SOLICITADO' },
        }),
      },
      finanzas: {
        totalPagosInfracciones,
        totalPagosPermisos,
        montoInfracciones: montoTotalInfracciones._sum.total || 0,
        montoPermisos: montoTotalPermisos._sum.total || 0,
        montoTotal:
          Number(montoTotalInfracciones._sum.total || 0) +
          Number(montoTotalPermisos._sum.total || 0),
      },
    };
  }

  /**
   * Métricas para Administrador Estatal
   */
  private async getSedeAdminMetrics(
    baseWhere: any,
    filters: DashboardFiltersDto,
    userSedeId: number,
  ) {
    const [
      totalSubsedes,
      totalUsuarios,
      totalInfracciones,
      totalPermisos,
      montoTotalInfracciones,
      montoTotalPermisos,
    ] = await Promise.all([
      this.prisma.subsede.count({
        where: { sedeId: userSedeId, isActive: true, deletedAt: null },
      }),
      this.prisma.user.count({
        where: { sedeId: userSedeId, isActive: true, deletedAt: null },
      }),
      this.prisma.infraccion.count({ where: { ...baseWhere.infraccion } }),
      this.prisma.permiso.count({ where: { ...baseWhere.permiso } }),
      this.prisma.pagoInfraccion.aggregate({
        where: { ...baseWhere.pagoInfraccion, estatus: 'PAGADO' },
        _sum: { total: true },
      }),
      this.prisma.pagoPermiso.aggregate({
        where: { ...baseWhere.pagoPermiso, estatus: 'PAGADO' },
        _sum: { total: true },
      }),
    ]);

    return {
      organizacion: {
        totalMunicipios: totalSubsedes,
        totalUsuarios,
      },
      infracciones: {
        total: totalInfracciones,
        pagadas: await this.prisma.infraccion.count({
          where: { ...baseWhere.infraccion, estatus: 'PAGADA' },
        }),
        pendientes: await this.prisma.infraccion.count({
          where: { ...baseWhere.infraccion, estatus: 'LEVANTADA' },
        }),
      },
      permisos: {
        total: totalPermisos,
        aprobados: await this.prisma.permiso.count({
          where: { ...baseWhere.permiso, estatus: 'APROBADO' },
        }),
        pendientes: await this.prisma.permiso.count({
          where: { ...baseWhere.permiso, estatus: 'SOLICITADO' },
        }),
      },
      finanzas: {
        montoInfracciones: montoTotalInfracciones._sum.total || 0,
        montoPermisos: montoTotalPermisos._sum.total || 0,
        montoTotal:
          Number(montoTotalInfracciones._sum.total || 0) +
          Number(montoTotalPermisos._sum.total || 0),
      },
    };
  }

  /**
   * Métricas para Administrador Municipal
   */
  private async getSubsedeMetrics(
    baseWhere: any,
    filters: DashboardFiltersDto,
    userSubsedeId: number | null,
  ) {
    const [
      totalUsuarios,
      totalInfracciones,
      totalPermisos,
      montoTotalInfracciones,
      montoTotalPermisos,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { subsedeId: userSubsedeId, isActive: true, deletedAt: null },
      }),
      this.prisma.infraccion.count({ where: { ...baseWhere.infraccion } }),
      this.prisma.permiso.count({ where: { ...baseWhere.permiso } }),
      this.prisma.pagoInfraccion.aggregate({
        where: { ...baseWhere.pagoInfraccion, estatus: 'PAGADO' },
        _sum: { total: true },
      }),
      this.prisma.pagoPermiso.aggregate({
        where: { ...baseWhere.pagoPermiso, estatus: 'PAGADO' },
        _sum: { total: true },
      }),
    ]);

    return {
      organizacion: {
        totalUsuarios,
      },
      infracciones: {
        total: totalInfracciones,
        pagadas: await this.prisma.infraccion.count({
          where: { ...baseWhere.infraccion, estatus: 'PAGADA' },
        }),
        pendientes: await this.prisma.infraccion.count({
          where: { ...baseWhere.infraccion, estatus: 'LEVANTADA' },
        }),
        vencidas: await this.prisma.infraccion.count({
          where: {
            ...baseWhere.infraccion,
            estatus: 'LEVANTADA',
            fechaLimitePago: { lt: new Date() },
          },
        }),
      },
      permisos: {
        total: totalPermisos,
        aprobados: await this.prisma.permiso.count({
          where: { ...baseWhere.permiso, estatus: 'APROBADO' },
        }),
        pendientes: await this.prisma.permiso.count({
          where: { ...baseWhere.permiso, estatus: 'SOLICITADO' },
        }),
        enRevision: await this.prisma.permiso.count({
          where: { ...baseWhere.permiso, estatus: 'EN_REVISION' },
        }),
      },
      finanzas: {
        montoInfracciones: montoTotalInfracciones._sum.total || 0,
        montoPermisos: montoTotalPermisos._sum.total || 0,
        montoTotal:
          Number(montoTotalInfracciones._sum.total || 0) +
          Number(montoTotalPermisos._sum.total || 0),
      },
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS - DATOS DE TENDENCIAS
  // ============================================

  private async getInfraccionesPorMes(baseWhere: any, fechaInicio: Date, fechaFin: Date) {
    const infracciones = await this.prisma.infraccion.groupBy({
      by: ['fechaInfraccion'],
      where: {
        ...baseWhere.infraccion,
        fechaInfraccion: { gte: fechaInicio, lte: fechaFin },
      },
      _count: true,
    });

    return this.groupByMonth(infracciones, 'fechaInfraccion');
  }

  private async getPagosPorMes(baseWhere: any, fechaInicio: Date, fechaFin: Date) {
    const pagosInfracciones = await this.prisma.pagoInfraccion.groupBy({
      by: ['fechaPago'],
      where: {
        ...baseWhere.pagoInfraccion,
        fechaPago: { gte: fechaInicio, lte: fechaFin },
        estatus: 'PAGADO',
      },
      _count: true,
      _sum: { total: true },
    });

    const pagosPermisos = await this.prisma.pagoPermiso.groupBy({
      by: ['fechaPago'],
      where: {
        ...baseWhere.pagoPermiso,
        fechaPago: { gte: fechaInicio, lte: fechaFin },
        estatus: 'PAGADO',
      },
      _count: true,
      _sum: { total: true },
    });

    return {
      infracciones: this.groupByMonthWithSum(pagosInfracciones, 'fechaPago'),
      permisos: this.groupByMonthWithSum(pagosPermisos, 'fechaPago'),
    };
  }

  private async getPermisosPorMes(baseWhere: any, fechaInicio: Date, fechaFin: Date) {
    const permisos = await this.prisma.permiso.groupBy({
      by: ['fechaSolicitud'],
      where: {
        ...baseWhere.permiso,
        fechaSolicitud: { gte: fechaInicio, lte: fechaFin },
      },
      _count: true,
    });

    return this.groupByMonth(permisos, 'fechaSolicitud');
  }

  // ============================================
  // MÉTODOS PRIVADOS - DISTRIBUCIONES
  // ============================================

  private async getInfraccionesPorTipo(baseWhere: any) {
    const infracciones = await this.prisma.infraccion.groupBy({
      by: ['multaId'],
      where: { ...baseWhere.infraccion },
      _count: true,
    });

    // Obtener nombres de las multas
    const multaIds = infracciones.map((i) => i.multaId);
    const multas = await this.prisma.multa.findMany({
      where: { id: { in: multaIds } },
      select: { id: true, nombre: true, codigo: true },
    });

    return infracciones.map((inf) => {
      const multa = multas.find((m) => m.id === inf.multaId);
      return {
        tipo: multa?.nombre || 'Desconocido',
        codigo: multa?.codigo || '',
        cantidad: inf._count,
      };
    });
  }

  private async getPagosPorMetodo(baseWhere: any) {
    const pagosInfracciones = await this.prisma.pagoInfraccion.groupBy({
      by: ['metodoPago'],
      where: { ...baseWhere.pagoInfraccion, estatus: 'PAGADO' },
      _count: true,
      _sum: { total: true },
    });

    const pagosPermisos = await this.prisma.pagoPermiso.groupBy({
      by: ['metodoPago'],
      where: { ...baseWhere.pagoPermiso, estatus: 'PAGADO' },
      _count: true,
      _sum: { total: true },
    });

    // Combinar ambos resultados
    const metodosMap = new Map();

    pagosInfracciones.forEach((p) => {
      metodosMap.set(p.metodoPago, {
        metodo: p.metodoPago,
        cantidad: p._count,
        monto: Number(p._sum.total || 0),
      });
    });

    pagosPermisos.forEach((p) => {
      const existing = metodosMap.get(p.metodoPago);
      if (existing) {
        existing.cantidad += p._count;
        existing.monto += Number(p._sum.total || 0);
      } else {
        metodosMap.set(p.metodoPago, {
          metodo: p.metodoPago,
          cantidad: p._count,
          monto: Number(p._sum.total || 0),
        });
      }
    });

    return Array.from(metodosMap.values());
  }

  private async getPermisosPorEstado(baseWhere: any) {
    const permisos = await this.prisma.permiso.groupBy({
      by: ['estatus'],
      where: { ...baseWhere.permiso },
      _count: true,
    });

    return permisos.map((p) => ({
      estatus: p.estatus,
      cantidad: p._count,
    }));
  }

  private async getTopMunicipios(
    baseWhere: any,
    userSedeId: number,
    isSuperAdmin: boolean,
  ) {
    const whereClause: any = { isActive: true, deletedAt: null };
    if (!isSuperAdmin) {
      whereClause.sedeId = userSedeId;
    }

    const subsedes = await this.prisma.subsede.findMany({
      where: whereClause,
      select: { id: true, name: true, code: true },
      take: 10,
    });

    const municipiosConMetricas = await Promise.all(
      subsedes.map(async (subsede) => {
        const [infracciones, permisos, ingresos] = await Promise.all([
          this.prisma.infraccion.count({
            where: { subsedeId: subsede.id, deletedAt: null },
          }),
          this.prisma.permiso.count({
            where: { subsedeId: subsede.id, deletedAt: null },
          }),
          this.prisma.pagoInfraccion.aggregate({
            where: { subsedeId: subsede.id, estatus: 'PAGADO', deletedAt: null },
            _sum: { total: true },
          }),
        ]);

        return {
          municipio: subsede.name,
          codigo: subsede.code,
          infracciones,
          permisos,
          ingresos: Number(ingresos._sum.total || 0),
        };
      }),
    );

    return municipiosConMetricas
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5);
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Construir whereClause base según multi-tenancy
   */
  private buildBaseWhere(
    isSuperAdmin: boolean,
    accessLevel: string,
    userSedeId: number,
    userSubsedeId: number | null,
    filters: DashboardFiltersDto,
  ) {
    const baseWhere: any = {
      infraccion: { deletedAt: null },
      pagoInfraccion: { deletedAt: null },
      permiso: { deletedAt: null },
      pagoPermiso: { deletedAt: null },
    };

    // Multi-tenancy
    if (!isSuperAdmin) {
      if (accessLevel === 'SEDE') {
        baseWhere.infraccion.sedeId = userSedeId;
        baseWhere.pagoInfraccion.sedeId = userSedeId;
        baseWhere.permiso.sedeId = userSedeId;
        baseWhere.pagoPermiso.sedeId = userSedeId;
      } else if (accessLevel === 'SUBSEDE') {
        baseWhere.infraccion.subsedeId = userSubsedeId;
        baseWhere.pagoInfraccion.subsedeId = userSubsedeId;
        baseWhere.permiso.subsedeId = userSubsedeId;
        baseWhere.pagoPermiso.subsedeId = userSubsedeId;
      }
    } else {
      // Super Admin puede filtrar explícitamente
      if (filters.sedeId) {
        baseWhere.infraccion.sedeId = filters.sedeId;
        baseWhere.pagoInfraccion.sedeId = filters.sedeId;
        baseWhere.permiso.sedeId = filters.sedeId;
        baseWhere.pagoPermiso.sedeId = filters.sedeId;
      }
      if (filters.subsedeId) {
        baseWhere.infraccion.subsedeId = filters.subsedeId;
        baseWhere.pagoInfraccion.subsedeId = filters.subsedeId;
        baseWhere.permiso.subsedeId = filters.subsedeId;
        baseWhere.pagoPermiso.subsedeId = filters.subsedeId;
      }
    }

    return baseWhere;
  }

  /**
   * Obtener rango de fechas (últimos 12 meses por defecto)
   */
  private getDateRange(filters: DashboardFiltersDto) {
    const fechaFin = filters.fechaFin ? new Date(filters.fechaFin) : new Date();
    const fechaInicio = filters.fechaInicio
      ? new Date(filters.fechaInicio)
      : new Date(new Date().setFullYear(fechaFin.getFullYear() - 1));

    return { fechaInicio, fechaFin };
  }

  /**
   * Agrupar datos por mes
   */
  private groupByMonth(data: any[], dateField: string) {
    const monthsMap = new Map();

    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, monthsMap.get(monthKey) + item._count);
      } else {
        monthsMap.set(monthKey, item._count);
      }
    });

    return Array.from(monthsMap.entries())
      .map(([month, count]) => ({ mes: month, cantidad: count }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }

  /**
   * Agrupar datos por mes con suma
   */
  private groupByMonthWithSum(data: any[], dateField: string) {
    const monthsMap = new Map();

    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthsMap.has(monthKey)) {
        const existing = monthsMap.get(monthKey);
        existing.cantidad += item._count;
        existing.monto += Number(item._sum.total || 0);
      } else {
        monthsMap.set(monthKey, {
          mes: monthKey,
          cantidad: item._count,
          monto: Number(item._sum.total || 0),
        });
      }
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));
  }
}
