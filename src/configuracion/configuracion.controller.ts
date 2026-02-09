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
import { ConfiguracionService } from './service/configuracion.service';
import { FinderConfiguracionService } from './service/finder-configuracion.service';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { FilterConfiguracionDto } from './dto/filter-configuracion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtHybridAuthGuard } from '../auth/guards/jwt-hybrid-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

/**
 * ConfiguracionController - Gestión de configuraciones de municipios
 * 
 * Endpoints protegidos con JWT y control de permisos
 * Multi-tenancy: Una configuración por subsede (relación 1:1)
 */
@ApiTags('Configuraciones')
@Controller('configuraciones')
export class ConfiguracionController {
  constructor(
    private readonly configuracionService: ConfiguracionService,
    private readonly finderService: FinderConfiguracionService,
  ) {}

  /**
   * POST /configuraciones - Crear nueva configuración
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([{ resource: 'configuraciones', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear una nueva configuración' })
  @ApiResponse({
    status: 201,
    description: 'Configuración creada exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'La subsede ya tiene una configuración',
  })
  async create(
    @Body() createDto: CreateConfiguracionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.configuracionService.create(
      createDto,
      user.sedeId,
      user.subsedeId,
      user.userId,
      user.accessLevel,
      user.subsedeAccessIds || [],
    );
  }

  /**
   * GET /configuraciones - Listar configuraciones
   */
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([{ resource: 'configuraciones', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener todas las configuraciones' })
  @ApiQuery({
    name: 'themeId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de tema',
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
    description: 'Buscar en nombreCliente, ciudad, titular',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de configuraciones',
  })
  async findAll(
    @Query() filters: FilterConfiguracionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderService.findAll(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.subsedeAccessIds || [],
    );
  }

  /**
   * GET /configuraciones/paginated - Listar configuraciones paginadas
   */
  @Get('paginated')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([{ resource: 'configuraciones', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener configuraciones paginadas' })
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
    description: 'Elementos por página (por defecto 10)',
  })
  @ApiQuery({
    name: 'themeId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de tema',
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
    description: 'Buscar en nombreCliente, ciudad, titular',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuraciones paginadas',
  })
  async findAllPaginated(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: FilterConfiguracionDto,
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
      user.subsedeAccessIds || [],
    );
  }

  /**
   * GET /configuraciones/:id - Obtener una configuración por ID
   */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([{ resource: 'configuraciones', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener una configuración por ID' })
  @ApiResponse({
    status: 200,
    description: 'Configuración encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada',
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
      user.subsedeAccessIds || [],
    );
  }

  /**
   * GET /configuraciones/subsede/:subsedeId - Obtener configuración por subsede
   * Este endpoint acepta tanto tokens de usuarios como de agentes
   */
  @Get('subsede/:subsedeId')
  @Public()
  @ApiBearerAuth()
  @UseGuards(JwtHybridAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Obtener configuración por subsedeId' })
  @ApiResponse({
    status: 200,
    description: 'Configuración encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada para esta subsede',
  })
  async findBySubsede(
    @Param('subsedeId', ParseIntPipe) subsedeId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderService.findBySubsede(
      subsedeId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.subsedeAccessIds || [],
    );
  }

  /**
   * PATCH /configuraciones/:id - Actualizar una configuración
   */
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([{ resource: 'configuraciones', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar una configuración' })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConfiguracionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.configuracionService.update(
      id,
      updateDto,
      user.sedeId,
      user.subsedeId,
      user.userId,
      user.accessLevel,
      user.roles,
      user.subsedeAccessIds || [],
    );
  }

  /**
   * DELETE /configuraciones/:id - Eliminar una configuración (soft delete)
   */
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions([{ resource: 'configuraciones', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Eliminar una configuración (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Configuración eliminada',
  })
  @ApiResponse({
    status: 404,
    description: 'Configuración no encontrada',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.configuracionService.remove(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.subsedeAccessIds || [],
    );
  }
}
