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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PermisoService } from './service/permiso.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { FilterPermisoDto } from './dto/filter-permiso.dto';
import { FindDniPermisoDto } from './dto/find-dni-permiso.dto';
import { Permiso } from './entities/permiso.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Request } from 'express';
import { FinderPermisoService } from './service/finder-permiso.service';
import { Public } from 'src/auth';

@ApiTags('Permisos')
@Controller('permiso')
export class PermisoController {
  constructor(
    private readonly finderPermisoService: FinderPermisoService,
    private readonly permisoService: PermisoService,
  ) {}

  @ApiOperation({ summary: 'Crear un permiso' })
  @ApiResponse({ status: 201, type: Permiso })
  @RequirePermissions({ resource: 'permiso', action: 'create' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Post()
  create(@Body() createPermisoDto: CreatePermisoDto, @Req() req: Request) {
    return this.permisoService.create(createPermisoDto, req.user);
  }

  @ApiOperation({ summary: 'Buscar permisos por DNI (paginado)' })
  @ApiResponse({ status: 200, type: [Permiso] })
  @Public()
  @Get('dni')
  findDNI(
    @Query() findDniDto: FindDniPermisoDto,
  ) {
    return this.finderPermisoService.findDNI(findDniDto);
  }

  @ApiOperation({ summary: 'Listar permisos paginados y filtrados' })
  @ApiResponse({ status: 200, type: [Permiso] })
  @RequirePermissions({ resource: 'permiso', action: 'read' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get()
  findAll(@Query() filters: FilterPermisoDto, @Req() req: Request) {
    return this.finderPermisoService.findAll(filters, req.user);
  }

  @ApiOperation({ summary: 'Obtener un permiso por ID' })
  @ApiResponse({ status: 200, type: Permiso })
  @ApiParam({ name: 'id', type: Number })
  @RequirePermissions({ resource: 'permiso', action: 'read' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.finderPermisoService.findOne(+id, req.user);
  }

  @ApiOperation({ summary: 'Actualizar un permiso' })
  @ApiResponse({ status: 200, type: Permiso })
  @ApiParam({ name: 'id', type: Number })
  @RequirePermissions({ resource: 'permiso', action: 'update' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePermisoDto: UpdatePermisoDto,
    @Req() req: Request,
  ) {
    return this.permisoService.update(+id, updatePermisoDto, req.user);
  }

  @ApiOperation({ summary: 'Eliminar (soft delete) un permiso' })
  @ApiResponse({ status: 200 })
  @ApiParam({ name: 'id', type: Number })
  @RequirePermissions({ resource: 'permiso', action: 'delete' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.permisoService.remove(+id, req.user);
  }

  @ApiOperation({ summary: 'Aprobar un permiso' })
  @ApiResponse({ status: 200, type: Permiso })
  @ApiParam({ name: 'id', type: Number })
  @Roles(
    'Administrador Estatal',
    'Super Administrador',
    'Administrador Municipal',
  )
  @RequirePermissions({ resource: 'permiso', action: 'approve' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch(':id/aprobar')
  aprobar(@Param('id') id: string, @Req() req: Request) {
    return this.permisoService.aprobar(+id, req.user);
  }

  @ApiOperation({ summary: 'Rechazar un permiso' })
  @ApiResponse({ status: 200, type: Permiso })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { properties: { motivoRechazo: { type: 'string' } } } })
  @Roles(
    'Administrador Estatal',
    'Super Administrador',
    'Administrador Municipal',
  )
  @RequirePermissions({ resource: 'permiso', action: 'reject' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Patch(':id/rechazar')
  rechazar(
    @Param('id') id: string,
    @Body('motivoRechazo') motivoRechazo: string,
    @Req() req: Request,
  ) {
    return this.permisoService.rechazar(+id, motivoRechazo, req.user);
  }
}
