import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PagosInfraccionesService } from './services/pagos-infracciones.service';
import { PagosInfraccionesFinderService } from './services/pagos-infracciones-finder.service';
import { CreatePagoInfraccionDto } from './dto/create-pago-infraccion.dto';
import { UpdatePagoInfraccionDto } from './dto/update-pago-infraccion.dto';
import { CreateReembolsoInfraccionDto } from './dto/create-reembolso-infraccion.dto';
import { FilterPagosInfraccionesDto } from './dto/filter-pagos-infracciones.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Pagos de Infracciones')
@Controller('pagos-infracciones')
export class PagosInfraccionesController {
  constructor(
    private readonly pagosInfraccionesService: PagosInfraccionesService,
    private readonly pagosInfraccionesFinderService: PagosInfraccionesFinderService,
  ) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post()
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'create' })
  @ApiOperation({ summary: 'Crear un nuevo pago de infracción' })
  @ApiResponse({ status: 201, description: 'Pago creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Multa no encontrada' })
  create(@Body() createDto: CreatePagoInfraccionDto, @Req() req: any) {
    return this.pagosInfraccionesService.create(createDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get()
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'read' })
  @ApiOperation({ summary: 'Listar pagos con paginación y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de pagos obtenida exitosamente' })
  findAll(@Query() filters: FilterPagosInfraccionesDto, @Req() req: any) {
    const user = req.user;
    return this.pagosInfraccionesFinderService.findAll(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('folio/:folioInfraccion')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener pagos por folio de infracción' })
  @ApiParam({ name: 'folioInfraccion', type: String, description: 'Folio de la infracción' })
  @ApiResponse({ status: 200, description: 'Pagos obtenidos exitosamente' })
  findByFolio(@Param('folioInfraccion') folioInfraccion: string, @Req() req: any) {
    const user = req.user;
    return this.pagosInfraccionesFinderService.findByFolio(
      folioInfraccion,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('multa/:multaId')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener pagos por multa (catálogo)' })
  @ApiParam({ name: 'multaId', type: Number, description: 'ID de la multa' })
  @ApiResponse({ status: 200, description: 'Pagos obtenidos exitosamente' })
  findByMulta(@Param('multaId', ParseIntPipe) multaId: number, @Req() req: any) {
    const user = req.user;
    return this.pagosInfraccionesFinderService.findByMulta(
      multaId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('estadisticas')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener estadísticas de pagos de infracciones' })
  @ApiQuery({ name: 'fechaInicio', required: false, type: String, description: 'Fecha inicio (ISO 8601)' })
  @ApiQuery({ name: 'fechaFin', required: false, type: String, description: 'Fecha fin (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  getStatistics(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Req() req?: any,
  ) {
    const user = req.user;
    return this.pagosInfraccionesFinderService.getStatistics(
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin ? new Date(fechaFin) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get(':id')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user;
    return this.pagosInfraccionesFinderService.findOne(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch(':id')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'update' })
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePagoInfraccionDto,
    @Req() req: any,
  ) {
    const user = req.user;
    return this.pagosInfraccionesService.update(
      id,
      updateDto,
      user,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Delete(':id')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'delete' })
  @ApiOperation({ summary: 'Cancelar un pago (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago cancelado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user;
    return this.pagosInfraccionesService.remove(
      id,
      user,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
  
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post('reembolso')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-infraccion', action: 'reembolsar' })
  @ApiOperation({ summary: 'Crear un reembolso (pago negativo)' })
  @ApiResponse({ status: 201, description: 'Reembolso creado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede reembolsar este pago' })
  @ApiResponse({ status: 404, description: 'Pago original no encontrado' })
  createReembolso(@Body() reembolsoDto: CreateReembolsoInfraccionDto, @Req() req: any) {
    const user = req.user;
    reembolsoDto.autorizadoPor = user.sub;
    return this.pagosInfraccionesService.createReembolso(reembolsoDto, user);
  }
}
