import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './services/dashboard.service';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Endpoint 1: Métricas Principales (Cards/KPIs)
   * - Total de registros, usuarios, etc.
   * - Información adaptada según el rol del usuario
   */
  @Get('metrics')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  @ApiOperation({
    summary: 'Obtener métricas principales del dashboard',
    description: `
      Retorna las métricas principales adaptadas según el rol del usuario:
      - Super Admin: Métricas globales (sedes, subsedes, totales)
      - Admin Estatal: Métricas de la sede (municipios, totales de la sede)
      - Admin Municipal: Métricas del municipio
    `,
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    type: String,
    description: 'Fecha de inicio (ISO 8601)',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    type: String,
    description: 'Fecha de fin (ISO 8601)',
  })
  @ApiQuery({
    name: 'sedeId',
    required: false,
    type: Number,
    description: 'Filtrar por sede (solo Super Admin)',
  })
  @ApiQuery({
    name: 'subsedeId',
    required: false,
    type: Number,
    description: 'Filtrar por subsede (Super Admin y Admin Estatal)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    schema: {
      example: {
        organizacion: {
          totalSedes: 5,
          totalSubsedes: 25,
          totalUsuarios: 150,
        },
        infracciones: {
          total: 1250,
          pagadas: 800,
          pendientes: 450,
        },
        permisos: {
          total: 350,
          aprobados: 280,
          pendientes: 70,
        },
        finanzas: {
          totalPagosInfracciones: 800,
          totalPagosPermisos: 280,
          montoInfracciones: 1200000.00,
          montoPermisos: 560000.00,
          montoTotal: 1760000.00,
        },
      },
    },
  })
  getMainMetrics(@Query() filters: DashboardFiltersDto, @Req() req: any) {
    const user = req.user;
    return this.dashboardService.getMainMetrics(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * Endpoint 2: Datos de Tendencias (Gráficos de Líneas)
   * - Infracciones por mes
   * - Pagos por mes
   * - Permisos por mes
   */
  @Get('trends')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  @ApiOperation({
    summary: 'Obtener datos de tendencias para gráficos de líneas',
    description: `
      Retorna datos agrupados por mes para visualizar tendencias:
      - Infracciones levantadas por mes
      - Pagos realizados por mes (con montos)
      - Permisos solicitados por mes
    `,
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    type: String,
    description: 'Fecha de inicio (por defecto: hace 12 meses)',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    type: String,
    description: 'Fecha de fin (por defecto: hoy)',
  })
  @ApiQuery({
    name: 'sedeId',
    required: false,
    type: Number,
    description: 'Filtrar por sede (solo Super Admin)',
  })
  @ApiQuery({
    name: 'subsedeId',
    required: false,
    type: Number,
    description: 'Filtrar por subsede (Super Admin y Admin Estatal)',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos de tendencias obtenidos exitosamente',
    schema: {
      example: {
        infracciones: [
          { mes: '2024-01', cantidad: 45 },
          { mes: '2024-02', cantidad: 52 },
          { mes: '2024-03', cantidad: 48 },
        ],
        pagos: {
          infracciones: [
            { mes: '2024-01', cantidad: 30, monto: 45000.00 },
            { mes: '2024-02', cantidad: 35, monto: 52500.00 },
          ],
          permisos: [
            { mes: '2024-01', cantidad: 15, monto: 22500.00 },
            { mes: '2024-02', cantidad: 18, monto: 27000.00 },
          ],
        },
        permisos: [
          { mes: '2024-01', cantidad: 20 },
          { mes: '2024-02', cantidad: 25 },
        ],
      },
    },
  })
  getTrendData(@Query() filters: DashboardFiltersDto, @Req() req: any) {
    const user = req.user;
    return this.dashboardService.getTrendData(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * Endpoint 3: Distribuciones (Gráficos Circulares/Barras)
   * - Infracciones por tipo
   * - Pagos por método
   * - Permisos por estado
   * - Top municipios (para Super Admin y Admin Estatal)
   */
  @Get('distributions')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'dashboard', action: 'read' })
  @ApiOperation({
    summary: 'Obtener distribuciones para gráficos circulares/barras',
    description: `
      Retorna datos de distribución para visualizaciones:
      - Infracciones agrupadas por tipo de multa
      - Pagos agrupados por método de pago
      - Permisos agrupados por estado
      - Top 5 municipios con más ingresos (solo para Super Admin y Admin Estatal)
    `,
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    type: String,
    description: 'Fecha de inicio',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    type: String,
    description: 'Fecha de fin',
  })
  @ApiQuery({
    name: 'sedeId',
    required: false,
    type: Number,
    description: 'Filtrar por sede (solo Super Admin)',
  })
  @ApiQuery({
    name: 'subsedeId',
    required: false,
    type: Number,
    description: 'Filtrar por subsede (Super Admin y Admin Estatal)',
  })
  @ApiResponse({
    status: 200,
    description: 'Distribuciones obtenidas exitosamente',
    schema: {
      example: {
        infraccionesPorTipo: [
          { tipo: 'Exceso de velocidad', codigo: 'TRA-001', cantidad: 350 },
          { tipo: 'Estacionamiento indebido', codigo: 'TRA-002', cantidad: 280 },
        ],
        pagosPorMetodo: [
          { metodo: 'EFECTIVO', cantidad: 450, monto: 675000.00 },
          { metodo: 'TARJETA_DEBITO', cantidad: 250, monto: 375000.00 },
          { metodo: 'TRANSFERENCIA', cantidad: 180, monto: 270000.00 },
        ],
        permisosPorEstado: [
          { estatus: 'APROBADO', cantidad: 180 },
          { estatus: 'SOLICITADO', cantidad: 45 },
          { estatus: 'EN_REVISION', cantidad: 30 },
        ],
        topMunicipios: [
          {
            municipio: 'Guadalajara',
            codigo: 'GDL',
            infracciones: 450,
            permisos: 180,
            ingresos: 675000.00,
          },
          {
            municipio: 'Zapopan',
            codigo: 'ZAP',
            infracciones: 380,
            permisos: 150,
            ingresos: 570000.00,
          },
        ],
      },
    },
  })
  getDistributionData(@Query() filters: DashboardFiltersDto, @Req() req: any) {
    const user = req.user;
    return this.dashboardService.getDistributionData(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
