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
import { ThemeService } from './service/theme.service';
import { FinderThemesService } from './service/finder-themes.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { FilterThemeDto } from './dto/filter-theme.dto';
import { ThemeEntity } from './entities/theme.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../auth/decorators/public.decorator';


/**
 * ThemeController - Gestión de temas visuales
 * 
 * Endpoints de LECTURA: Accesibles para todos los usuarios autenticados
 * Endpoints de ESCRITURA: Solo SUPER_ADMIN
 */
@ApiTags('Themes')
@Controller('themes')
export class ThemeController {
  constructor(
    private readonly themeService: ThemeService,
    private readonly finderService: FinderThemesService,
  ) { }

  /**
   * POST /themes - Crear nuevo tema
   * Solo SUPER_ADMIN
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Crear un nuevo tema (Solo SUPER_ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Tema creado exitosamente',
    type: ThemeEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Solo Super Administradores pueden crear temas',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un tema con ese nombre',
  })
  async create(
    @Body() createDto: CreateThemeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.themeService.create(createDto, user.roles);
  }

  /**
   * GET /themes - Listar temas
   * Accesible para todos los usuarios autenticados
   */

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener todos los temas' })
  @ApiQuery({
    name: 'darkMode',
    required: false,
    type: Boolean,
    description: 'Filtrar por modo oscuro',
  })
  @ApiQuery({
    name: 'isDefault',
    required: false,
    type: Boolean,
    description: 'Filtrar por tema por defecto',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar en nombre y descripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de temas',
    type: [ThemeEntity],
  })
  async findAll(@Query() filters: FilterThemeDto) {
    return this.finderService.findAll(filters);
  }

  /**
   * GET /themes/paginated - Listar temas paginados
   * Accesible para todos los usuarios autenticados
   */
  @Public()
  @Get('paginated')
  @ApiOperation({ summary: 'Obtener temas paginados' })
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
    name: 'darkMode',
    required: false,
    type: Boolean,
    description: 'Filtrar por modo oscuro',
  })
  @ApiQuery({
    name: 'isDefault',
    required: false,
    type: Boolean,
    description: 'Filtrar por tema por defecto',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar en nombre y descripción',
  })
  @ApiResponse({
    status: 200,
    description: 'Temas paginados',
  })
  async findAllPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() filters: FilterThemeDto,
  ) {
    const activatePaginated = filters.activatePaginated ?? true;
    return this.finderService.findAllPaginated(
      page,
      limit,
      filters,
      activatePaginated,
    );
  }

  /**
   * GET /themes/default - Obtener tema por defecto
   * Accesible para todos los usuarios autenticados
   */
  @Public()
  @Get('default')
  @ApiOperation({ summary: 'Obtener el tema por defecto del sistema' })
  @ApiResponse({
    status: 200,
    description: 'Tema por defecto',
    type: ThemeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'No hay temas disponibles',
  })
  async findDefault() {
    return this.finderService.findDefault();
  }

  /**
   * GET /themes/:id - Obtener un tema por ID
   * Accesible para todos los usuarios autenticados
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tema por ID' })
  @ApiResponse({
    status: 200,
    description: 'Tema encontrado',
    type: ThemeEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Tema no encontrado',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.finderService.findOne(id);
  }

  /**
   * PATCH /themes/:id - Actualizar un tema
   * Solo SUPER_ADMIN
   */
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar un tema (Solo SUPER_ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Tema actualizado',
    type: ThemeEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'Solo Super Administradores pueden actualizar temas',
  })
  @ApiResponse({
    status: 404,
    description: 'Tema no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un tema con ese nombre',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateThemeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.themeService.update(id, updateDto, user.roles);
  }

  /**
   * DELETE /themes/:id - Eliminar un tema
   * Solo SUPER_ADMIN
   */
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Eliminar un tema (Solo SUPER_ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Tema eliminado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar el tema por defecto o tiene configuraciones asociadas',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo Super Administradores pueden eliminar temas',
  })
  @ApiResponse({
    status: 404,
    description: 'Tema no encontrado',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.themeService.remove(id, user.roles);
  }
}

