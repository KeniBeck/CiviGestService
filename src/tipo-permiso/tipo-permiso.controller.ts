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
import { TipoPermisoService } from './service/tipo-permiso.service';
import { FinderTipoPermisoService } from './service/finder.service';
import { CreateTipoPermisoDto } from './dto/create-tipo-permiso.dto';
import { UpdateTipoPermisoDto } from './dto/update-tipo-permiso.dto';
import { FilterTipoPermisoDto } from './dto/filter-tipo-permiso.dto';
import { TipoPermisoEntity } from './entities/tipo-permiso.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

/**
 * TiposPermisoController - Controlador REST para gestión de tipos de permiso
 * 
 * Endpoints protegidos con JWT y control de permisos basado en roles
 * Multi-tenancy: Usuarios operan SOLO en su subsede (municipio)
 */
@ApiTags('Tipos de Permiso')
@ApiBearerAuth()
@Controller('tipos-permiso')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TipoPermisoController {
  constructor(
    private readonly tipoPermisoService: TipoPermisoService,
    private readonly finderService: FinderTipoPermisoService,
  ) {}

  /**
   * POST /tipos-permiso - Crear nuevo tipo de permiso
   * - sedeId y subsedeId se toman del usuario autenticado
   * - Usuario debe tener subsedeId asignado
   * - Nombre debe ser único dentro de la subsede
   */
  @Post()
  @Permissions([{ resource: 'tipos-permiso', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear nuevo tipo de permiso' })
  @ApiResponse({
    status: 201,
    description: 'Tipo de permiso creado exitosamente',
    type: TipoPermisoEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o usuario sin subsede asignada',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un tipo de permiso con ese nombre en el municipio',
  })
  async create(
    @Body() createTipoPermisoDto: CreateTipoPermisoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tipoPermisoService.create(
      createTipoPermisoDto,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  /**
   * GET /tipos-permiso - Listar tipos de permiso con paginación y filtros
   * - SUPER_ADMIN: Ve todos los tipos de permiso
   * - ADMIN_ESTATAL: Ve tipos de permiso de su sede
   * - ADMIN_MUNICIPAL: Ve tipos de permiso de su subsede
   */
  @Get()
  @Permissions([{ resource: 'tipos-permiso', action: 'read' }] as Policy[])
  @ApiOperation({
    summary: 'Listar tipos de permiso con paginación y filtros opcionales',
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
    description: 'Buscar en nombre o descripción',
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
    description: 'Elementos por página (por defecto 10, máximo 100)',
  })
  @ApiQuery({
    name: 'activatePaginated',
    required: false,
    type: Boolean,
    description:
      'Si es false, devuelve todos los registros sin paginación. Por defecto: true',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de tipos de permiso con metadata',
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: FilterTipoPermisoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderService.findAllPaginated(
      filters,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * GET /tipos-permiso/:id - Obtener un tipo de permiso por ID
   */
  @Get(':id')
  @Permissions([{ resource: 'tipos-permiso', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener un tipo de permiso por ID' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de permiso encontrado',
    type: TipoPermisoEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de permiso no encontrado o sin acceso',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tipoPermisoService.findOne(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * PATCH /tipos-permiso/:id - Actualizar tipo de permiso
   */
  @Patch(':id')
  @Permissions([{ resource: 'tipos-permiso', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar tipo de permiso' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de permiso actualizado exitosamente',
    type: TipoPermisoEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de permiso no encontrado o sin acceso',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un tipo de permiso con ese nombre en el municipio',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTipoPermisoDto: UpdateTipoPermisoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tipoPermisoService.update(
      id,
      updateTipoPermisoDto,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * DELETE /tipos-permiso/:id - Eliminar tipo de permiso (soft delete)
   * - No se puede eliminar si tiene permisos activos asociados
   */
  @Delete(':id')
  @Permissions([{ resource: 'tipos-permiso', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Eliminar tipo de permiso (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Tipo de permiso eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tipo de permiso no encontrado o sin acceso',
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar porque tiene permisos asociados',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tipoPermisoService.remove(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
