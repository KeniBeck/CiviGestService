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
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AgenteService } from './service/agente.service';
import { FinderAgenteService } from './service/finder-agente.service';
import { CreateAgenteDto } from './dto/create-agente.dto';
import { UpdateAgenteDto } from './dto/update-agente.dto';
import { FilterAgenteDto } from './dto/filter-agente.dto';
import { AgenteEntity } from './entities/agente.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

/**
 * AgenteController - Controlador REST para gestión de agentes
 * 
 * Endpoints protegidos con JWT y control de permisos basado en roles
 * Multi-tenancy: Usuarios operan SOLO en su subsede (municipio)
 */
@ApiTags('Agentes')
@ApiBearerAuth()
@Controller('agentes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgenteController {
  constructor(
    private readonly agenteService: AgenteService,
    private readonly finderService: FinderAgenteService,
  ) {}

  /**
   * POST /agentes - Crear nuevo agente
   */
  @Post()
  @Permissions([{ resource: 'agentes', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear nuevo agente' })
  @ApiResponse({
    status: 201,
    description: 'Agente creado exitosamente',
    type: AgenteEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario sin subsede asignada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un agente con ese número de plantilla',
  })
  async create(
    @Body() createAgenteDto: CreateAgenteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.agenteService.create(
      createAgenteDto,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  /**
   * GET /agentes - Listar agentes con filtros (sin paginación)
   */
  @Get()
  @Permissions([{ resource: 'agentes', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Listar agentes con filtros' })
  @ApiQuery({
    name: 'tipoId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de tipo de agente',
  })
  @ApiQuery({
    name: 'departamentoId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de departamento',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo/inactivo',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar en nombres, apellidos, número de plantilla o correo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de agentes',
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: FilterAgenteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderService.findAll(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * GET /agentes/paginated - Listar agentes con paginación
   */
  @Get('paginated')
  @Permissions([{ resource: 'agentes', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Listar agentes con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'tipoId', required: false, type: Number })
  @ApiQuery({ name: 'departamentoId', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'activatePaginated', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Lista de agentes paginada',
  })
  async findAllPaginated(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: FilterAgenteDto,
    @CurrentUser() user: RequestUser,
  ) {
    const activatePaginated = filters.activatePaginated ?? true;
    return this.finderService.findAllPaginated(
      page,
      limit,
      filters,
      activatePaginated,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * GET /agentes/:id - Obtener un agente por ID
   */
  @Get(':id')
  @Permissions([{ resource: 'agentes', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener un agente por ID' })
  @ApiResponse({
    status: 200,
    description: 'Agente encontrado',
    type: AgenteEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Agente no encontrado o sin acceso',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderService.findOne(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * PATCH /agentes/:id - Actualizar agente
   */
  @Patch(':id')
  @Permissions([{ resource: 'agentes', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar agente' })
  @ApiResponse({
    status: 200,
    description: 'Agente actualizado exitosamente',
    type: AgenteEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Agente no encontrado o sin acceso',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un agente con ese número de plantilla',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAgenteDto: UpdateAgenteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.agenteService.update(
      id,
      updateAgenteDto,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * DELETE /agentes/:id - Eliminar agente (soft delete)
   */
  @Delete(':id')
  @Permissions([{ resource: 'agentes', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Eliminar agente (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Agente eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Agente no encontrado o sin acceso',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.agenteService.remove(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
