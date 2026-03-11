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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InfraccionesService } from './services/infracciones.service';
import { InfraccionesFinderService } from './services/infracciones-finder.service';
import { CreateInfraccionDto } from './dto/create-infraccion.dto';
import { UpdateInfraccionDto } from './dto/update-infraccion.dto';
import { FilterInfraccionesDto } from './dto/filter-infracciones.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Infracciones')
@Controller('infracciones')
export class InfraccionesController {
  constructor(
    private readonly infraccionesService: InfraccionesService,
    private readonly infraccionesFinderService: InfraccionesFinderService,
  ) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post()
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'infraccion', action: 'create' })
  @ApiOperation({ summary: 'Crear una nueva infracción (levantamiento)' })
  @ApiResponse({ status: 201, description: 'Infracción creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Multa no encontrada' })
  @ApiResponse({ status: 409, description: 'Folio duplicado' })
  create(@Body() createDto: CreateInfraccionDto, @Req() req: any) {
    return this.infraccionesService.create(createDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get()
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'infraccion', action: 'read' })
  @ApiOperation({ summary: 'Listar infracciones con paginación y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de infracciones obtenida exitosamente' })
  findAll(@Query() filters: FilterInfraccionesDto, @Req() req: any) {
    const user = req.user;
    return this.infraccionesFinderService.findAll(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('folio/:folio')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener infracción por folio' })
  @ApiParam({ name: 'folio', type: String, description: 'Folio de la infracción' })
  @ApiResponse({ status: 200, description: 'Infracción obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Infracción no encontrada' })
  findByFolio(@Param('folio') folio: string, @Req() req: any) {
    const user = req.user;
    return this.infraccionesFinderService.findByFolio(
      folio,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get('documento/:documento')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener infracciones por documento de ciudadano' })
  @ApiParam({ name: 'documento', type: String, description: 'Documento del ciudadano' })
  @ApiResponse({ status: 200, description: 'Infracciones obtenidas exitosamente' })
  findByDocumento(@Param('documento') documento: string, @Req() req: any) {
    const user = req.user;
    return this.infraccionesFinderService.findByDocumento(
      documento,
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
  @RequirePermissions({ resource: 'infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener estadísticas de infracciones' })
  @ApiQuery({ name: 'fechaInicio', required: false, type: String, description: 'Fecha inicio (ISO 8601)' })
  @ApiQuery({ name: 'fechaFin', required: false, type: String, description: 'Fecha fin (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  getStatistics(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Req() req?: any,
  ) {
    const user = req.user;
    return this.infraccionesFinderService.getStatistics(
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
  @RequirePermissions({ resource: 'infraccion', action: 'read' })
  @ApiOperation({ summary: 'Obtener una infracción por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la infracción' })
  @ApiResponse({ status: 200, description: 'Infracción obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Infracción no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user;
    return this.infraccionesFinderService.findOne(
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
  @RequirePermissions({ resource: 'infraccion', action: 'update' })
  @ApiOperation({ summary: 'Actualizar una infracción' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la infracción' })
  @ApiResponse({ status: 200, description: 'Infracción actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Infracción no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede modificar una infracción pagada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInfraccionDto,
    @Req() req: any,
  ) {
    const user = req.user;
    return this.infraccionesService.update(
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
  @RequirePermissions({ resource: 'infraccion', action: 'delete' })
  @ApiOperation({ summary: 'Cancelar una infracción (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la infracción' })
  @ApiResponse({ status: 200, description: 'Infracción cancelada exitosamente' })
  @ApiResponse({ status: 404, description: 'Infracción no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar una infracción con pagos' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user;
    return this.infraccionesService.remove(
      id,
      user,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
