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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DepartamentoService } from './service/departamento.service';
import { FinderDepartamentoService } from './service/finder-departamento.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { FilterDepartamentoDto } from './dto/filter-departamento.dto';
import { DepartamentoEntity } from './entities/departamento.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { Permissions } from 'src/auth';

@ApiTags('Departamentos')
@ApiBearerAuth()
@Controller('departamentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartamentoController {
  constructor(
    private readonly departamentoService: DepartamentoService,
    private readonly finderService: FinderDepartamentoService,
  ) {}

  @Post()
  @Permissions([{ resource: 'departamentos', action: 'create' }])
  @ApiOperation({ summary: 'Crear un nuevo departamento' })
  @ApiResponse({
    status: 201,
    description: 'Departamento creado exitosamente',
    type: DepartamentoEntity,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El departamento ya existe' })
  create(
    @Body() createDepartamentoDto: CreateDepartamentoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.departamentoService.create(
      createDepartamentoDto,
      user.sedeId,
      user.subsedeId,
      user.userId,
    );
  }

  @Get()
  @Permissions([{ resource: 'departamentos', action: 'read' }])
  @ApiOperation({ summary: 'Obtener todos los departamentos con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos',
    type: [DepartamentoEntity],
  })
  findAll(
    @Query(new ValidationPipe({ transform: true })) filters: FilterDepartamentoDto,
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
  @Permissions([{ resource: 'departamentos', action: 'read' }])
  @ApiOperation({
    summary: 'Obtener departamentos con paginación y filtros opcionales',
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
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo/inactivo',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Búsqueda por nombre o descripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Departamentos paginados con metadata',
  })
  async findAllPaginated(
    @CurrentUser() user: RequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
    @Query('activatePaginated') activatePaginated?: boolean,
  ) {
    // Construir el objeto de filtros
    const filters: FilterDepartamentoDto = {};

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

  @Get(':id')
  @Permissions([{ resource: 'departamentos', action: 'read' }])
  @ApiOperation({ summary: 'Obtener un departamento por ID' })
  @ApiResponse({
    status: 200,
    description: 'Departamento encontrado',
    type: DepartamentoEntity,
  })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  findOne(
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

  @Patch(':id')
  @Permissions([{ resource: 'departamentos', action: 'update' }])
  @ApiOperation({ summary: 'Actualizar un departamento' })
  @ApiResponse({
    status: 200,
    description: 'Departamento actualizado',
    type: DepartamentoEntity,
  })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  @ApiResponse({ status: 409, description: 'El nombre ya existe' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartamentoDto: UpdateDepartamentoDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.departamentoService.update(
      id,
      updateDepartamentoDto,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @Delete(':id')
  @Permissions([{ resource: 'departamentos', action: 'delete' }])
  @ApiOperation({ summary: 'Eliminar (soft delete) un departamento' })
  @ApiResponse({ status: 200, description: 'Departamento eliminado' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.departamentoService.remove(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
