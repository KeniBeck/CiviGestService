import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AccessLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterMultaDto } from '../dto/filter-multa.dto';
import { PaginatedResponse } from '../../common/services/interface/paginate-operation';
import { MultaPaginationService } from '../../common/services/pagination/multa/multa-pagination.service';

/**
 * FinderMultaService - Servicio de búsqueda de multas
 * 
 * Control de acceso por nivel de rol:
 * - SUPER_ADMIN: Ve todas las multas del sistema
 * - ESTATAL (SEDE): Ve multas de su sede
 * - MUNICIPAL (SUBSEDE): Ve multas de su subsede
 */
@Injectable()
export class FinderMultaService {
  constructor(
    private prisma: PrismaService,
    private paginationService: MultaPaginationService,
  ) {}

  /**
   * Listar multas según nivel de acceso
   * Aplica filtros de departamento, isActive y search
   */
  async findAll(
    filters: FilterMultaDto,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir where clause base
    const whereClause: any = {
      deletedAt: null,
    };

    // Aplicar filtros por tenant según nivel de acceso
    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        // ADMIN_ESTATAL: solo multas de su sede
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        // ADMIN_MUNICIPAL: solo multas de su subsede
        if (!userSubsedeId) {
          throw new BadRequestException(
            'El usuario debe tener una subsede asignada',
          );
        }
        whereClause.subsedeId = userSubsedeId;
      }
    }

    // Aplicar filtro de departamento por ID
    if (filters.departamentoId) {
      whereClause.departamentoId = filters.departamentoId;
    }

    // Aplicar filtro de isActive
    if (filters.isActive !== undefined) {
      whereClause.isActive = filters.isActive;
    }

    // Aplicar filtro de búsqueda (nombre, codigo, descripcion)
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.trim();
      
      whereClause.OR = [
        { nombre: { contains: searchTerm, mode: 'insensitive' } },
        { codigo: { contains: searchTerm, mode: 'insensitive' } },
        { descripcion: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Ejecutar query
    return this.prisma.multa.findMany({
      where: whereClause,
      include: {
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
      orderBy: [
        { departamentoId: 'asc' },
        { codigo: 'asc' },
      ],
    });
  }

  /**
   * Obtener multas paginadas con prefetch
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters: FilterMultaDto,
    activatePaginated: boolean,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ): Promise<PaginatedResponse<any>> {
    return this.paginationService.paginateMultas({
      prisma: this.prisma,
      page,
      limit,
      filters,
      activatePaginated,
      userSedeId,
      userSubsedeId,
      accessLevel,
      roles,
    });
  }

  /**
   * Obtener una multa por ID
   * Valida que el usuario tenga acceso a la multa según su nivel
   */
  async findOne(
    id: number,
    userSedeId: number,
    userSubsedeId: number | null,
    accessLevel: AccessLevel,
    roles: string[],
  ) {
    const isSuperAdmin = roles?.includes('Super Administrador');

    // Construir where clause según nivel de acceso
    const whereClause: any = {
      id,
      deletedAt: null,
    };

    if (!isSuperAdmin) {
      if (accessLevel === AccessLevel.SEDE) {
        // ADMIN_ESTATAL: solo multas de su sede
        whereClause.sedeId = userSedeId;
      } else if (accessLevel === AccessLevel.SUBSEDE) {
        // ADMIN_MUNICIPAL: solo multas de su subsede
        if (!userSubsedeId) {
          throw new BadRequestException(
            'El usuario debe tener una subsede asignada',
          );
        }
        whereClause.subsedeId = userSubsedeId;
      }
    }

    const multa = await this.prisma.multa.findFirst({
      where: whereClause,
      include: {
        sede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subsede: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        departamento: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    });

    if (!multa) {
      throw new NotFoundException(
        `Multa con ID ${id} no encontrada o no tienes acceso a ella`,
      );
    }

    return multa;
  }
}
