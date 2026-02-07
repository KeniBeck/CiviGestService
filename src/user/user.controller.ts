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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { FinderUserService } from './service/finder-user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginatedUsersQueryDto } from './dto/paginated-users-query.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BooleanTransformPipe } from '../common/pipes/boolean-transform.pipe';
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
    // No sobrescribir sedeId y subsedeId aquí
    // El servicio validará los permisos según el rol del creador
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
   * GET /users/paginated - Listar usuarios con paginación
   * Permisos: Super Admin (todos), SEDE (su sede), SUBSEDE (su subsede)
   * Filtros opcionales: sedeId, subsedeId, isActive, search
   */
  @Get('paginated')
  @Permissions([
    { resource: 'users', action: 'read' },
  ] as Policy[])
  @ApiOperation({
    summary: 'Obtener usuarios con paginación y filtros opcionales',
  })
  @ApiQuery({
    name: 'activatePaginated',
    required: false,
    type: Boolean,
    description:
      'Si es false, devuelve todos los registros sin paginación. Por defecto: true',
  })
  async findPaginated(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    queryParams: PaginatedUsersQueryDto,
    @Query('activatePaginated', new BooleanTransformPipe(true))
    activatePaginated: boolean,
    @CurrentUser() user: RequestUser,
  ) {
    try {
      // Construir el objeto de filtros
      const filters: FilterUsersDto = {};

      if (queryParams.sedeId) {
        filters.sedeId = queryParams.sedeId;
      }

      if (queryParams.subsedeId) {
        filters.subsedeId = queryParams.subsedeId;
      }

      if (queryParams.isActive !== undefined) {
        filters.isActive = queryParams.isActive;
      }

      console.log(filters.isActive); 

      if (queryParams.search && queryParams.search.trim() !== '') {
        filters.search = queryParams.search.trim();
      }

      // Si activatePaginated es falso, establecerlo en el objeto filters
      if (activatePaginated === false) {
        filters.activatePaginated = false;
      }

      // Obtener los datos paginados
      return await this.finderUserService.findAllPaginated(
        queryParams.page || 1,
        queryParams.limit || 10,
        filters,
        activatePaginated,
        user.sedeId,
        user.subsedeId,
        user.accessLevel,
        user.userId,
        user.roles,
        user.sedeAccessIds,
        user.subsedeAccessIds,
      );
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error(`Error processing paginated request: ${error.message}`);
    }
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
   * PATCH /users/change-password - Cambiar la propia contraseña
   */
  @Patch('change-password')
  @Permissions([
    { resource: 'users', action: 'update' },
  ] as Policy[])
  @ApiOperation({ summary: 'Cambiar la propia contraseña' })
  async changeOwnPassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userService.changeOwnPassword(
      user.userId,
      dto.oldPassword as string,
      dto.newPassword,
    );
  }

  /**
   * PATCH /users/:id/change-password - Cambiar contraseña de otro usuario (admin)
   */
  @Patch(':id/change-password')
  @Permissions([
    { resource: 'users', action: 'update' },
  ] as Policy[])
  @ApiOperation({ summary: 'Cambiar la contraseña de otro usuario (según permisos)' })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: ChangePasswordDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.userService.changePasswordByAdmin(
      id,
      user.userId,
      user.sedeId,
      user.subsedeId,
      user.accessLevel,
      user.roles,
      user.sedeAccessIds,
      user.subsedeAccessIds,
      dto.newPassword,
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

