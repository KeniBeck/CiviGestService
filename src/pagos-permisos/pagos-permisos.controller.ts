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
  ApiParam 
} from '@nestjs/swagger';
import { PagosPermisosService } from './services/pagos-permisos.service';
import { PagosPermisosFinderService } from './services/pagos-permisos-finder.service';
import { CreatePagoPermisoDto } from './dto/create-pago-permiso.dto';
import { UpdatePagoPermisoDto } from './dto/update-pago-permiso.dto';
import { CreateReembolsoDto } from './dto/create-reembolso.dto';
import { FilterPagosPermisosDto } from './dto/filter-pagos-permisos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Pagos de Permisos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('pagos-permisos')
export class PagosPermisosController {
  constructor(
    private readonly pagosPermisosService: PagosPermisosService,
    private readonly pagosPermisosFinderService: PagosPermisosFinderService,
  ) {}

  @Post()
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-permiso', action: 'create' })
  @ApiOperation({ summary: 'Crear un nuevo pago de permiso' })
  @ApiResponse({ status: 201, description: 'Pago creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Permiso no encontrado' })
  create(@Body() createDto: CreatePagoPermisoDto, @Req() req: any) {
    return this.pagosPermisosService.create(createDto, req.user);
  }

  @Get()
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-permiso', action: 'read' })
  @ApiOperation({ summary: 'Listar pagos con paginación y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de pagos obtenida exitosamente' })
  findAll(@Query() filters: FilterPagosPermisosDto, @Req() req: any) {
    const user = req.user;
    return this.pagosPermisosFinderService.findAll(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @Get(':id')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-permiso', action: 'read' })
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user;
    return this.pagosPermisosFinderService.findOne(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @Patch(':id')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-permiso', action: 'update' })
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePagoPermisoDto,
    @Req() req: any,
  ) {
    const user = req.user;
    return this.pagosPermisosService.update(
      id,
      updateDto,
      user,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @Delete(':id')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-permiso', action: 'delete' })
  @ApiOperation({ summary: 'Cancelar un pago (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del pago' })
  @ApiResponse({ status: 200, description: 'Pago cancelado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const user = req.user;
    return this.pagosPermisosService.remove(
      id,
      user,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @Post('reembolso')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-permiso', action: 'reembolsar' })
  @ApiOperation({ summary: 'Crear un reembolso (pago negativo)' })
  @ApiResponse({ status: 201, description: 'Reembolso creado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede reembolsar este pago' })
  @ApiResponse({ status: 404, description: 'Pago original no encontrado' })
  createReembolso(@Body() reembolsoDto: CreateReembolsoDto, @Req() req: any) {
    return this.pagosPermisosService.createReembolso(reembolsoDto, req.user);
  }

  @Post(':id/generar-enlace-publico')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal', 'Operativo')
  @RequirePermissions({ resource: 'pago-permiso', action: 'read' })
  @ApiOperation({ summary: 'Generar enlace público temporal al comprobante' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del pago' })
  @ApiResponse({
    status: 200,
    description: 'Enlace público generado',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        enlacePublico: {
          type: 'string',
          example: 'https://civiggest.com/comprobantes/abc123...',
        },
        expiraEn: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async generarEnlacePublico(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    return this.pagosPermisosService.generarEnlacePublico(id, req.user);
  }

  @Public()
  @Get('publico/:token')
  @ApiOperation({ summary: 'Obtener datos del comprobante por token público (sin autenticación)' })
  @ApiParam({ name: 'token', type: String, description: 'Token público del comprobante' })
  @ApiResponse({
    status: 200,
    description: 'Datos del comprobante',
  })
  @ApiResponse({
    status: 404,
    description: 'Comprobante no encontrado o expirado',
  })
  async verComprobantePublico(@Param('token') token: string) {
    return this.pagosPermisosService.getComprobantePublico(token);
  }
}

