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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PatrullaService } from './service/patrulla.service';
import { FinderPatrullaService } from './service/finder-patrulla.service';
import { CreatePatrullaDto } from './dto/create-patrulla.dto';
import { UpdatePatrullaDto } from './dto/update-patrulla.dto';
import { FilterPatrullaDto } from './dto/filter-patrulla.dto';
import { PatrullaEntity } from './entities/patrulla.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

/**
 * PatrullaController - Controlador REST para gestión de patrullas
 * 
 * Endpoints protegidos con JWT y control de permisos basado en roles
 * Multi-tenancy: Usuarios operan SOLO en su subsede (municipio)
 */
@ApiTags('Patrullas')
@ApiBearerAuth()
@Controller('patrullas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatrullaController {
  constructor(
    private readonly patrullaService: PatrullaService,
    private readonly finderService: FinderPatrullaService,
  ) {}

  /**
   * POST /patrullas - Crear nueva patrulla
   */
  @Post()
  @Permissions([{ resource: 'patrullas', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear una nueva patrulla' })
  @ApiResponse({
    status: 201,
    description: 'Patrulla creada exitosamente',
    type: PatrullaEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o agente no válido',
  })
  @ApiResponse({
    status: 409,
    description: 'Placa o número de patrulla duplicado',
  })
  async create(
    @Body() createDto: CreatePatrullaDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patrullaService.create(
      createDto,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  /**
   * GET /patrullas - Listar patrullas con filtros
   */
  @Get()
  @Permissions([{ resource: 'patrullas', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener todas las patrullas con filtros' })
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
    description: 'Buscar en marca, modelo, placa, numPatrulla, serie',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de patrullas',
  })
  async findAll(
    @Query() filters: FilterPatrullaDto,
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
   * GET /patrullas/paginated - Listar patrullas paginadas
   */
  @Get('paginated')
  @Permissions([{ resource: 'patrullas', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener patrullas paginadas' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (por defecto 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página (por defecto 10, máximo 100)',
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
    description: 'Buscar en marca, modelo, placa, numPatrulla, serie',
  })
  @ApiQuery({
    name: 'activatePaginated',
    required: false,
    type: Boolean,
    description: 'Activar paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Patrullas paginadas',
  })
  async findAllPaginated(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: FilterPatrullaDto,
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
   * GET /patrullas/:id - Obtener una patrulla por ID
   */
  @Get(':id')
  @Permissions([{ resource: 'patrullas', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener una patrulla por ID' })
  @ApiResponse({
    status: 200,
    description: 'Patrulla encontrada',
    type: PatrullaEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Patrulla no encontrada o sin acceso',
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
   * PATCH /patrullas/:id - Actualizar una patrulla
   */
  @Patch(':id')
  @Permissions([{ resource: 'patrullas', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar una patrulla' })
  @ApiResponse({
    status: 200,
    description: 'Patrulla actualizada',
    type: PatrullaEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Patrulla no encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Placa o número de patrulla duplicado',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePatrullaDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patrullaService.update(
      id,
      updateDto,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * DELETE /patrullas/:id - Eliminar una patrulla (soft delete)
   */
  @Delete(':id')
  @Permissions([{ resource: 'patrullas', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Eliminar una patrulla (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Patrulla eliminada',
  })
  @ApiResponse({
    status: 404,
    description: 'Patrulla no encontrada',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.patrullaService.remove(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
