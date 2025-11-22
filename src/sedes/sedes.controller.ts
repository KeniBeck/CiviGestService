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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SedesService } from './service/sedes.service';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
import { SedeEntity } from './entities/sede.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { FinderSedesService } from './service/finder-sedes.service';

@ApiTags('Sedes')
@ApiBearerAuth()
@Controller('sedes')
@UseGuards(JwtAuthGuard)
export class SedesController {
  constructor(
    private readonly sedesService: SedesService,
    private readonly finderSedesService: FinderSedesService,
  ) {}

  /**
   * Crear nueva sede (departamento/cliente que contrata)
   * Solo Super Admins pueden crear sedes
   */
  @Post()
  @Roles('Super Administrador')
  @RequirePermissions({ resource: 'sedes', action: 'create' })
  @UseGuards(RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Crear nueva sede (departamento/cliente)' })
  @ApiResponse({
    status: 201,
    description: 'Sede creada exitosamente',
    type: SedeEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para crear sedes',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una sede con ese código o email',
  })
  create(
    @Body() createSedeDto: CreateSedeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.sedesService.create(createSedeDto, user.id);
  }

  /**
   * Listar todas las sedes
   * - SUPER_ADMIN: Ve todas las sedes del sistema
   * - SEDE: Ve su propia sede y las que tenga acceso explícito
   * - SUBSEDE: Ve solo su sede
   */
  @Get()
  @ApiOperation({ summary: 'Listar todas las sedes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sedes',
    type: [SedeEntity],
  })
  findAll(@CurrentUser() user: RequestUser) {
    return this.finderSedesService.findAll(
      user.sedeId,
      user.accessLevel,
      user.id,
      user.roles,
      user.sedeAccessIds,
    );
  }

  /**
   * Obtener una sede por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sede por ID' })
  @ApiResponse({
    status: 200,
    description: 'Sede encontrada',
    type: SedeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Sede no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes acceso a esta sede',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderSedesService.findOne(
      id,
      user.sedeId,
      user.accessLevel,
      user.id,
      user.roles,
    );
  }

  /**
   * Actualizar sede
   */
  @Patch(':id')
  @RequirePermissions({ resource: 'sedes', action: 'update' })
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Actualizar sede' })
  @ApiResponse({
    status: 200,
    description: 'Sede actualizada exitosamente',
    type: SedeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Sede no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes acceso a esta sede',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSedeDto: UpdateSedeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.sedesService.update(
      id,
      updateSedeDto,
      user.sedeId,
      user.accessLevel,
      user.id,
      user.roles,
    );
  }

  /**
   * Eliminar sede (soft delete)
   * Solo Super Admins pueden eliminar sedes
   */
  @Delete(':id')
  @Roles('Super Administrador')
  @RequirePermissions({ resource: 'sedes', action: 'delete' })
  @UseGuards(RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Eliminar sede' })
  @ApiResponse({
    status: 200,
    description: 'Sede eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Sede no encontrada',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sedesService.remove(id);
  }

  /**
   * Activar/Desactivar sede
   * Solo Super Admins pueden cambiar el estado de sedes
   */
  @Patch(':id/toggle-active')
  @Roles('Super Administrador')
  @RequirePermissions({ resource: 'sedes', action: 'update' })
  @UseGuards(RolesGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Activar/Desactivar sede' })
  @ApiResponse({
    status: 200,
    description: 'Estado de la sede actualizado',
  })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.sedesService.toggleActive(id);
  }
}
