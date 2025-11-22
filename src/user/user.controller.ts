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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { FinderUserService } from './service/finder-user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { Policy } from '../auth/decorators/permissions.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';

/**
 * UserController - Controlador de gestión de usuarios
 * 
 * Endpoints protegidos con JWT y control de permisos basado en roles
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly finderUserService: FinderUserService,
  ) {}

  /**
   * POST /users - Crear nuevo usuario
   * Permisos: Super Admin, SEDE (solo en su sede), SUBSEDE (solo en su subsede)
   */
  @Post()
  @Permissions([
    { resource: 'users', action: 'create' },
  ] as Policy[])
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: RequestUser,
  ) {
    createUserDto.sedeId = user.sedeId;
    createUserDto.subsedeId = user.subsedeId ?? undefined;
    console.log(user.roles)
    return this.userService.create(
      createUserDto,
      user.userId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
    );
  }

  /**
   * GET /users - Listar usuarios
   * Permisos: Super Admin (todos), SEDE (su sede), SUBSEDE (su subsede)
   * Filtros opcionales: sedeId, subsedeId, isActive, search
   */
  @Get()
  @Permissions([
    { resource: 'users', action: 'read' },
  ] as Policy[])
  @ApiOperation({ summary: 'Listar usuarios con filtros' })
  @ApiQuery({ name: 'sedeId', required: false, type: Number })
  @ApiQuery({ name: 'subsedeId', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('sedeId') sedeId?: string,
    @Query('subsedeId') subsedeId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};

    if (sedeId) filters.sedeId = parseInt(sedeId);
    if (subsedeId) filters.subsedeId = parseInt(subsedeId);
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    return this.finderUserService.findAll(
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.userId,
      user.roles,
      user.sedeAccessIds,
      user.subsedeAccessIds,
      filters,
    );
  }

  /**
   * GET /users/sede/:sedeId - Listar usuarios por sede
   * Permisos: Super Admin, SEDE (si tiene acceso)
   */
  @Get('sede/:sedeId')
  @Permissions([
    { resource: 'users', action: 'read' },
  ] as Policy[])
  @ApiOperation({ summary: 'Listar usuarios de una sede específica' })
  async findBySedeId(
    @Param('sedeId', ParseIntPipe) sedeId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderUserService.findBySedeId(
      sedeId,
      user.sedeId,
      user.accessLevel,
      user.roles,
      user.sedeAccessIds,
    );
  }

  /**
   * GET /users/subsede/:subsedeId - Listar usuarios por subsede
   * Permisos: Super Admin, SEDE (si subsede pertenece a su sede), SUBSEDE (si tiene acceso)
   */
  @Get('subsede/:subsedeId')
  @Permissions([
    { resource: 'users', action: 'read' },
  ] as Policy[])
  @ApiOperation({ summary: 'Listar usuarios de una subsede específica' })
  async findBySubsedeId(
    @Param('subsedeId', ParseIntPipe) subsedeId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderUserService.findBySubsedeId(
      subsedeId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.subsedeAccessIds,
    );
  }

  /**
   * GET /users/:id - Obtener un usuario por ID
   * Permisos: Super Admin, SEDE (si usuario pertenece a su sede), SUBSEDE (si usuario pertenece a su subsede)
   */
  @Get(':id')
  @Permissions([
    { resource: 'users', action: 'read' },
  ] as Policy[])
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.finderUserService.findOne(
      id,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.userId,
      user.roles,
      user.sedeAccessIds,
      user.subsedeAccessIds,
    );
  }

  /**
   * PATCH /users/:id - Actualizar usuario
   * Permisos: Super Admin, SEDE (si usuario pertenece a su sede), SUBSEDE (si usuario pertenece a su subsede)
   */
  @Patch(':id')
  @Permissions([
    { resource: 'users', action: 'update' },
  ] as Policy[])
  @ApiOperation({ summary: 'Actualizar un usuario' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userService.update(
      id,
      updateUserDto,
      user.userId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.sedeAccessIds,
      user.subsedeAccessIds,
    );
  }

  /**
   * PATCH /users/:id/toggle-active - Activar/desactivar usuario
   * Permisos: Super Admin, SEDE (si usuario pertenece a su sede), SUBSEDE (si usuario pertenece a su subsede)
   */
  @Patch(':id/toggle-active')
  @Permissions([
    { resource: 'users', action: 'update' },
  ] as Policy[])
  @ApiOperation({ summary: 'Activar o desactivar un usuario' })
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userService.toggleActive(
      id,
      user.userId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.sedeAccessIds,
      user.subsedeAccessIds,
    );
  }

  /**
   * DELETE /users/:id - Soft delete de usuario
   * Permisos: Super Admin, SEDE (si usuario pertenece a su sede), SUBSEDE (si usuario pertenece a su subsede)
   */
  @Delete(':id')
  @Permissions([
    { resource: 'users', action: 'delete' },
  ] as Policy[])
  @ApiOperation({ summary: 'Eliminar un usuario (soft delete)' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userService.remove(
      id,
      user.userId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.sedeAccessIds,
      user.subsedeAccessIds,
    );
  }
}

