import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SubsedesService } from './service/sudsedes.service';
import { FinderSubsedesService } from './service/finder-sudsedes.service';
import { CreateSubsedeDto } from './dto/create-sudsede.dto';
import { UpdateSubsedeDto } from './dto/update-sudsede.dto';
import { SubsedeEntity } from './entities/sudsede.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { PaginatedSubsedesQueryDto } from './dto/paginated-subsedes-query.dto';
import { FilterSubsedesDto } from './dto/filter-subsedes.dto';
import { BooleanTransformPipe } from '../common/pipes/boolean-transform.pipe';

@ApiTags('Subsedes')
@ApiBearerAuth()
@Controller('subsedes')
@UseGuards(JwtAuthGuard)
export class SubsedesController {
  constructor(
    private readonly subsedesService: SubsedesService,
    private readonly finderSubsedesService: FinderSubsedesService,
  ) {}

  /**
   * Crear nueva subsede (municipio/oficina)
   * Super Admin: puede crear en cualquier sede
   * Usuario SEDE: solo en su propia sede
   */
  @Post()
  @RequirePermissions({ resource: 'subsedes', action: 'create' })
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Crear nueva subsede (municipio/oficina)' })
  @ApiResponse({
    status: 201,
    description: 'Subsede creada exitosamente',
    type: SubsedeEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para crear subsedes',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una subsede con ese código en esta sede',
  })
  create(
    @Body() createSubsedeDto: CreateSubsedeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.subsedesService.create(
      createSubsedeDto,
      user.userId,
      user.sedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * Listar subsedes con paginación y filtros
   */
  @Get('paginated')
  @ApiOperation({
    summary: 'Obtener subsedes con paginación y filtros opcionales',
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
    description: 'Lista paginada de subsedes',
  })
  async findPaginated(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    queryParams: PaginatedSubsedesQueryDto,
    @Query('activatePaginated', new BooleanTransformPipe(true))
    activatePaginated: boolean,
    @CurrentUser() user: RequestUser,
  ) {
    try {
      // Construir el objeto de filtros
      const filters: FilterSubsedesDto = {};

      if (queryParams.sedeId) {
        filters.sedeId = queryParams.sedeId;
      }

      if (queryParams.isActive !== undefined) {
        filters.isActive = queryParams.isActive;
      }

      if (queryParams.search && queryParams.search.trim() !== '') {
        filters.search = queryParams.search.trim();
      }

      // Si activatePaginated es falso, establecerlo en el objeto filters
      if (activatePaginated === false) {
        filters.activatePaginated = false;
      }

      // Obtener los datos paginados
      return await this.finderSubsedesService.findAllPaginated(
        queryParams.page || 1,
        queryParams.limit || 10,
        filters,
        activatePaginated,
        user.sedeId,
        user.subsedeId,
        user.accessLevel,
        user.userId,
        user.roles,
        user.subsedeAccessIds,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Error processing paginated request: ${error.message}`);
    }
  }

  /**
   * Listar todas las subsedes según permisos
   * - SUPER_ADMIN: Ve todas las subsedes del sistema
   * - SEDE: Ve todas las subsedes de su sede
   * - SUBSEDE: Ve solo su propia subsede
   */
  @Get()
  @ApiOperation({ summary: 'Listar subsedes' })
  @ApiQuery({
    name: 'sedeId',
    required: false,
    description: 'Filtrar por ID de sede (solo Super Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de subsedes',
    type: [SubsedeEntity],
  })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('sedeId', new ParseIntPipe({ optional: true })) sedeId?: number,
  ) {
    return this.finderSubsedesService.findAll(
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.userId,
      user.roles,
      user.subsedeAccessIds,
      sedeId,
    );
  }

  /**
   * Listar subsedes por sede
   */
  @Get('sede/:sedeId')
  @ApiOperation({ summary: 'Listar subsedes de una sede específica' })
  @ApiResponse({
    status: 200,
    description: 'Lista de subsedes de la sede',
    type: [SubsedeEntity],
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes acceso a las subsedes de esta sede',
  })
  findBySedeId(
    @Param('sedeId', ParseIntPipe) sedeId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderSubsedesService.findBySedeId(
      sedeId,
      user.sedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * Obtener una subsede por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una subsede por ID' })
  @ApiResponse({
    status: 200,
    description: 'Subsede encontrada',
    type: SubsedeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Subsede no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes acceso a esta subsede',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderSubsedesService.findOne(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.userId,
      user.roles,
      user.subsedeAccessIds,
    );
  }

  /**
   * Actualizar subsede
   * Super Admin: puede actualizar cualquier subsede
   * Usuario SEDE: solo subsedes de su sede
   * Usuario SUBSEDE: solo su propia subsede
   */
  @Patch(':id')
  @RequirePermissions({ resource: 'subsedes', action: 'update' })
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Actualizar subsede' })
  @ApiResponse({
    status: 200,
    description: 'Subsede actualizada exitosamente',
    type: SubsedeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Subsede no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes acceso a esta subsede',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubsedeDto: UpdateSubsedeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.subsedesService.update(
      id,
      updateSubsedeDto,
      user.userId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * Eliminar subsede (soft delete)
   * Super Admin: puede eliminar cualquier subsede
   * Usuario SEDE: solo subsedes de su sede
   */
  @Delete(':id')
  @RequirePermissions({ resource: 'subsedes', action: 'delete' })
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Eliminar subsede' })
  @ApiResponse({
    status: 200,
    description: 'Subsede eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Subsede no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes acceso a esta subsede',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.subsedesService.remove(
      id,
      user.sedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * Activar/Desactivar subsede
   * Super Admin: cualquier subsede
   * Usuario SEDE: solo de su sede
   */
  @Patch(':id/toggle-active')
  @RequirePermissions({ resource: 'subsedes', action: 'update' })
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Activar/Desactivar subsede' })
  @ApiResponse({
    status: 200,
    description: 'Estado de la subsede actualizado',
  })
  toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.subsedesService.toggleActive(
      id,
      user.sedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
