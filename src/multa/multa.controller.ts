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
import { MultaService } from './service/multa.service';
import { FinderMultaService } from './service/finder.service';
import { CreateMultaDto } from './dto/create-multa.dto';
import { UpdateMultaDto } from './dto/update-multa.dto';
import { FilterMultaDto } from './dto/filter-multa.dto';
import { PaginatedMultasQueryDto } from './dto/paginated-multas-query.dto';
import { MultaEntity } from './entities/multa.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

/**
 * MultaController - Controlador REST para gestión de multas
 * 
 * Endpoints protegidos con JWT y control de permisos basado en roles
 * Multi-tenancy: Usuarios operan SOLO en su subsede (municipio)
 */
@ApiTags('Multas')
@ApiBearerAuth()
@Controller('multas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MultaController {
  constructor(
    private readonly multaService: MultaService,
    private readonly finderService: FinderMultaService,
  ) {}

  /**
   * POST /multas - Crear nueva multa
   * - sedeId y subsedeId se toman del usuario autenticado
   * - Usuario debe tener subsedeId asignado
   * - Código debe ser único dentro de la subsede
   */
  @Post()
  @Permissions([{ resource: 'multas', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear nueva multa' })
  @ApiResponse({
    status: 201,
    description: 'Multa creada exitosamente',
    type: MultaEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario sin subsede asignada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una multa con ese código en el municipio',
  })
  async create(
    @Body() createMultaDto: CreateMultaDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.multaService.create(
      createMultaDto,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  /**
   * GET /multas - Listar multas con filtros opcionales
   * - SUPER_ADMIN: Ve todas las multas
   * - ADMIN_ESTATAL: Ve multas de su sede
   * - ADMIN_MUNICIPAL: Ve multas de su subsede
   */
  @Get()
  @Permissions([{ resource: 'multas', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Listar multas con filtros opcionales' })
  @ApiQuery({
    name: 'departamento',
    required: false,
    type: String,
    description: 'Filtrar por departamento',
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
    description: 'Buscar en nombre, código o descripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de multas',
    type: [MultaEntity],
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: FilterMultaDto,
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

  @Get('paginated')
  @Permissions([{ resource: 'multas', action: 'read' }] as Policy[])
  @ApiOperation({
    summary: 'Obtener multas con paginación y filtros opcionales',
  })
  @ApiQuery({
    name: 'activatePaginated',
    required: false,
    type: Boolean,
    description:
      'Si es false, devuelve todos los registros sin paginación. Por defecto: true',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página actual (por defecto 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (por defecto 10)',
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
    description: 'Búsqueda por nombre, código o descripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Multas paginadas con metadata',
  })
  async findAllPaginated(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('departamentoId') departamentoId?: number,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('activatePaginated') activatePaginated?: boolean,
  ) {
    // Construir el objeto de filtros
    const filters: FilterMultaDto = {};

    if (departamentoId) {
      filters.departamentoId = departamentoId;
    }

    if (isActive !== undefined) {
      filters.isActive = isActive;
    }

    if (search && search.trim() !== '') {
      filters.search = search.trim();
    }

    // Si activatePaginated es falso, establecerlo en el objeto filters
    if (activatePaginated === false) {
      filters.activatePaginated = false;
    }

    // Obtener los datos paginados
    return this.finderService.findAllPaginated(
      page || 1,
      limit || 10,
      filters,
      activatePaginated !== false,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * GET /multas/:id - Obtener una multa por ID
   * - Valida que el usuario tenga acceso a la multa
   */
  @Get(':id')
  @Permissions([{ resource: 'multas', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener una multa por ID' })
  @ApiResponse({
    status: 200,
    description: 'Multa encontrada',
    type: MultaEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Multa no encontrada o sin acceso',
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
   * PATCH /multas/:id - Actualizar multa
   * - Valida que el usuario tenga acceso a la multa
   * - Si se cambia el código, valida unicidad
   */
  @Patch(':id')
  @Permissions([{ resource: 'multas', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar multa' })
  @ApiResponse({
    status: 200,
    description: 'Multa actualizada exitosamente',
    type: MultaEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Multa no encontrada o sin acceso',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una multa con ese código en el municipio',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMultaDto: UpdateMultaDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.multaService.update(
      id,
      updateMultaDto,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * DELETE /multas/:id - Eliminar multa (soft delete)
   * - Valida que el usuario tenga acceso a la multa
   */
  @Delete(':id')
  @Permissions([{ resource: 'multas', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Eliminar multa' })
  @ApiResponse({
    status: 200,
    description: 'Multa eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Multa no encontrada o sin acceso',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.multaService.remove(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}

