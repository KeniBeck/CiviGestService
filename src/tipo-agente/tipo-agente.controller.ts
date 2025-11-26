import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TipoAgenteService } from './service/tipo-agente.service';
import { FinderTipoAgenteService } from './service/finder-tipo-agente.service';
import { CreateTipoAgenteDto } from './dto/create-tipo-agente.dto';
import { UpdateTipoAgenteDto } from './dto/update-tipo-agente.dto';
import { FilterTipoAgenteDto } from './dto/filter-tipo-agente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Tipos de Agente')
@ApiBearerAuth()
@Controller('tipos-agente')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TipoAgenteController {
  constructor(
    private readonly tipoAgenteService: TipoAgenteService,
    private readonly finderService: FinderTipoAgenteService,
  ) {}

  @Post()
  @Permissions([{ resource: 'tipos-agente', action: 'create' }] as Policy[])
  @ApiOperation({ summary: 'Crear un nuevo tipo de agente' })
  @ApiResponse({ status: 201, description: 'Tipo de agente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El tipo ya existe en el municipio' })
  create(
    @Body() createDto: CreateTipoAgenteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tipoAgenteService.create(
      createDto,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @Get()
  @Permissions([{ resource: 'tipos-agente', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener todos los tipos de agente con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de agente' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query() filters: FilterTipoAgenteDto,
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
  @Permissions([{ resource: 'tipos-agente', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener tipos de agente paginados' })
  @ApiResponse({ status: 200, description: 'Tipos de agente paginados' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'activatePaginated', required: false, type: Boolean })
  findAllPaginated(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: FilterTipoAgenteDto,
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

  @Get(':id')
  @Permissions([{ resource: 'tipos-agente', action: 'read' }] as Policy[])
  @ApiOperation({ summary: 'Obtener un tipo de agente por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de agente encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de agente no encontrado' })
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
  @Permissions([{ resource: 'tipos-agente', action: 'update' }] as Policy[])
  @ApiOperation({ summary: 'Actualizar un tipo de agente' })
  @ApiResponse({ status: 200, description: 'Tipo de agente actualizado' })
  @ApiResponse({ status: 404, description: 'Tipo de agente no encontrado' })
  @ApiResponse({ status: 409, description: 'El tipo ya existe en el municipio' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTipoAgenteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tipoAgenteService.update(
      id,
      updateDto,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  @Delete(':id')
  @Permissions([{ resource: 'tipos-agente', action: 'delete' }] as Policy[])
  @ApiOperation({ summary: 'Eliminar un tipo de agente (soft delete)' })
  @ApiResponse({ status: 200, description: 'Tipo de agente eliminado' })
  @ApiResponse({ status: 404, description: 'Tipo de agente no encontrado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar porque tiene agentes asociados' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tipoAgenteService.remove(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }
}
