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
@Controller('pagos-permisos')
export class PagosPermisosController {
  constructor(
    private readonly pagosPermisosService: PagosPermisosService,
    private readonly pagosPermisosFinderService: PagosPermisosFinderService,
  ) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post('reembolso')
  @Roles('Super Administrador', 'Administrador Estatal', 'Administrador Municipal')
  @RequirePermissions({ resource: 'pago-permiso', action: 'reembolsar' })
  @ApiOperation({ summary: 'Crear un reembolso (pago negativo)' })
  @ApiResponse({ status: 201, description: 'Reembolso creado exitosamente' })
  @ApiResponse({ status: 400, description: 'No se puede reembolsar este pago' })
  @ApiResponse({ status: 404, description: 'Pago original no encontrado' })
  createReembolso(@Body() reembolsoDto: CreateReembolsoDto, @Req() req: any) {
    const user = req.user;
    reembolsoDto.autorizadoPor = user.sub;
    return this.pagosPermisosService.createReembolso(reembolsoDto, user);
  }
}

