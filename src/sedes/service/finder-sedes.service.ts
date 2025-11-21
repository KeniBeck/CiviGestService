import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AccessLevel } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FinderSedesService {

    constructor(private prisma: PrismaService) { }

    /**
      * Listar todas las sedes
      * - SUPER_ADMIN: Ve todas las sedes
      * - SEDE: Solo ve su propia sede y aquellas a las que tiene acceso explícito
      * - SUBSEDE: Ve la sede a la que pertenece su subsede
      */
    async findAll(
        sedeId: number,
        accessLevel: AccessLevel,
        userId: number,
        roles: string[],
    ) {
        // Si es Super Administrador, puede ver TODAS las sedes
        if (roles?.includes('Super Administrador')) {
            return this.prisma.sede.findMany({
                where: {
                    deletedAt: null,
                },
                include: {
                    _count: {
                        select: {
                            subsedes: true,
                            users: true,
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });
        }

        // Si el usuario tiene acceso SEDE, puede ver su sede y las que tenga acceso explícito
        if (accessLevel === AccessLevel.SEDE) {
            // Obtener sedes con acceso explícito
            const userSedeAccess = await this.prisma.userSedeAccess.findMany({
                where: {
                    userId,
                    isActive: true,
                },
                select: {
                    sedeId: true,
                },
            });

            const accessibleSedeIds = [
                sedeId, // Su propia sede
                ...userSedeAccess.map((usa) => usa.sedeId),
            ];

            return this.prisma.sede.findMany({
                where: {
                    id: { in: accessibleSedeIds },
                    deletedAt: null,
                },
                include: {
                    _count: {
                        select: {
                            subsedes: true,
                            users: true,
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });
        }

        // Si tiene acceso SUBSEDE, solo ve su sede
        if (accessLevel === AccessLevel.SUBSEDE) {
            return this.prisma.sede.findMany({
                where: {
                    id: sedeId,
                    deletedAt: null,
                },
                include: {
                    _count: {
                        select: {
                            subsedes: true,
                            users: true,
                        },
                    },
                },
            });
        }

        return [];
    }

    /**
     * Obtener una sede por ID
     * Valida que el usuario tenga acceso a esa sede
     */
    async findOne(
        id: number,
        userSedeId: number,
        accessLevel: AccessLevel,
        userId: number,
        roles: string[],
    ) {
        const sede = await this.prisma.sede.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                subsedes: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        isActive: true,
                        address: true,
                    },
                    orderBy: {
                        name: 'asc',
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });

        if (!sede) {
            throw new NotFoundException(`Sede con ID ${id} no encontrada`);
        }

        // Si es Super Administrador, puede ver cualquier sede
        if (roles?.includes('Super Administrador')) {
            return sede;
        }

        // Validar acceso según nivel
        if (accessLevel === AccessLevel.SEDE) {
            // Puede ver su propia sede o sedes con acceso explícito
            if (id !== userSedeId) {
                const hasAccess = await this.prisma.userSedeAccess.findFirst({
                    where: {
                        userId,
                        sedeId: id,
                        isActive: true,
                    },
                });

                if (!hasAccess) {
                    throw new ForbiddenException('No tienes acceso a esta sede');
                }
            }

            return sede;
        }

        if (accessLevel === AccessLevel.SUBSEDE) {
            // Solo puede ver su propia sede
            if (id !== userSedeId) {
                throw new ForbiddenException('No tienes acceso a esta sede');
            }

            return sede;
        }

        throw new ForbiddenException('Acceso denegado');
    }

}