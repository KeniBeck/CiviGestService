import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ValidationService - Servicio común de validaciones
 * 
 * Centraliza validaciones comunes que se usan en múltiples servicios:
 * - Validación de existencia de sedes
 * - Validación de existencia de subsedes
 * - Validación de existencia de roles
 * - Validación de unicidad de campos
 */
@Injectable()
export class ValidationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Validar que una sede existe y está activa
     */
    async validateSedeExists(sedeId: number): Promise<void> {
        const sede = await this.prisma.sede.findFirst({
            where: {
                id: sedeId,
                isActive: true,
                deletedAt: null,
            },
        });

        if (!sede) {
            throw new BadRequestException(
                `La sede con ID ${sedeId} no existe o está inactiva`,
            );
        }
    }

    /**
     * Validar que una subsede existe, está activa y pertenece a una sede
     */
    async validateSubsedeExists(
        subsedeId: number,
        sedeId?: number,
    ): Promise<void> {
        const where: any = {
            id: subsedeId,
            isActive: true,
            deletedAt: null,
        };

        if (sedeId) {
            where.sedeId = sedeId;
        }

        const subsede = await this.prisma.subsede.findFirst({ where });

        if (!subsede) {
            if (sedeId) {
                throw new BadRequestException(
                    `La subsede con ID ${subsedeId} no existe, está inactiva o no pertenece a la sede ${sedeId}`,
                );
            } else {
                throw new BadRequestException(
                    `La subsede con ID ${subsedeId} no existe o está inactiva`,
                );
            }
        }
    }

    /**
     * Validar que múltiples sedes existen y están activas
     * Retorna las sedes encontradas
     */
    async validateSedesExist(sedeIds: number[]) {
        if (!sedeIds || sedeIds.length === 0) {
            return [];
        }

        const sedes = await this.prisma.sede.findMany({
            where: {
                id: { in: sedeIds },
                isActive: true,
                deletedAt: null,
            },
        });

        if (sedes.length !== sedeIds.length) {
            const foundIds = sedes.map((s) => s.id);
            const missingIds = sedeIds.filter((id) => !foundIds.includes(id));
            throw new BadRequestException(
                `Las siguientes sedes no existen o están inactivas: ${missingIds.join(', ')}`,
            );
        }

        return sedes;
    }

    /**
     * Validar que múltiples subsedes existen y están activas
     * Retorna las subsedes encontradas
     */
    async validateSubsedesExist(subsedeIds: number[]) {
        if (!subsedeIds || subsedeIds.length === 0) {
            return [];
        }

        const subsedes = await this.prisma.subsede.findMany({
            where: {
                id: { in: subsedeIds },
                isActive: true,
                deletedAt: null,
            },
        });

        if (subsedes.length !== subsedeIds.length) {
            const foundIds = subsedes.map((s) => s.id);
            const missingIds = subsedeIds.filter((id) => !foundIds.includes(id));
            throw new BadRequestException(
                `Las siguientes subsedes no existen o están inactivas: ${missingIds.join(', ')}`,
            );
        }

        return subsedes;
    }

    /**
     * Validar que múltiples roles existen y están activos
     * Retorna los roles encontrados
     */
    async validateRolesExist(roleIds: number[]) {
        if (!roleIds || roleIds.length === 0) {
            return [];
        }

        const roles = await this.prisma.role.findMany({
            where: {
                id: { in: roleIds },
                isActive: true,
            },
        });

        if (roles.length !== roleIds.length) {
            const foundIds = roles.map((r) => r.id);
            const missingIds = roleIds.filter((id) => !foundIds.includes(id));
            throw new BadRequestException(
                `Los siguientes roles no existen o están inactivos: ${missingIds.join(', ')}`,
            );
        }

        return roles;
    }

    /**
     * Validar que un email no esté en uso
     */
    async validateEmailUnique(email: string, excludeUserId?: number): Promise<void> {
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser && existingUser.id !== excludeUserId) {
            throw new BadRequestException('El email ya está registrado');
        }
    }

    /**
     * Validar que un username no esté en uso
     */
    async validateUsernameUnique(username: string, excludeUserId?: number): Promise<void> {
        const existingUser = await this.prisma.user.findUnique({
            where: { username },
        });

        if (existingUser && existingUser.id !== excludeUserId) {
            throw new BadRequestException('El username ya está en uso');
        }
    }

    /**
     * Validar que un documento no esté en uso
     */
    async validateDocumentUnique(
        documentNumber: string,
        excludeUserId?: number,
    ): Promise<void> {
        const existingUser = await this.prisma.user.findUnique({
            where: { documentNumber },
        });

        if (existingUser && existingUser.id !== excludeUserId) {
            throw new BadRequestException('El número de documento ya está registrado');
        }
    }

    /**
     * Validar que un usuario existe y está activo
     */
    async validateUserExists(userId: number): Promise<void> {
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                deletedAt: null,
            },
        });

        if (!user) {
            throw new BadRequestException(
                `El usuario con ID ${userId} no existe o fue eliminado`,
            );
        }
    }

    /**
     * Validar que las subsedes pertenezcan a una sede específica
     * Retorna las subsedes que NO pertenecen a la sede
     */
    async validateSubsedesBelongToSede(
        subsedeIds: number[],
        sedeId: number,
    ): Promise<number[]> {
        if (!subsedeIds || subsedeIds.length === 0) {
            return [];
        }

        const subsedes = await this.prisma.subsede.findMany({
            where: {
                id: { in: subsedeIds },
                isActive: true,
                deletedAt: null,
            },
            select: {
                id: true,
                sedeId: true,
            },
        });


        // Encontrar subsedes que NO pertenecen a la sede especificada
        const invalidSubsedeIds = subsedes
            .filter((subsede) => subsede.sedeId !== sedeId)
            .map((subsede) => subsede.id);

        return invalidSubsedeIds;
    }

    /**
     * Validar jerarquía de roles
     * Un usuario solo puede asignar roles de su nivel o inferiores
     */
    validateRoleHierarchy(
        roles: { name: string; level: string }[],
        creatorAccessLevel: string,
        isSuperAdmin: boolean,
    ): void {
        if (isSuperAdmin) {
            return; // Super Admin puede asignar cualquier rol
        }

        // Solo Super Admin puede asignar Super Administrador
        const hasSuperAdminRole = roles.some(
            (role) => role.name === 'Super Administrador',
        );
        if (hasSuperAdminRole) {
            throw new BadRequestException(
                'Solo un Super Administrador puede asignar el rol de Super Administrador',
            );
        }

        // Validar niveles permitidos según el nivel del creador
        for (const role of roles) {
            if (creatorAccessLevel === 'SEDE') {
                const allowedLevels = ['ESTATAL', 'MUNICIPAL', 'OPERATIVO'];
                if (!allowedLevels.includes(role.level)) {
                    throw new BadRequestException(
                        `No tienes permisos para asignar el rol "${role.name}" (nivel ${role.level})`,
                    );
                }
            } else if (creatorAccessLevel === 'SUBSEDE') {
                const allowedLevels = ['MUNICIPAL', 'OPERATIVO'];
                if (!allowedLevels.includes(role.level)) {
                    throw new BadRequestException(
                        `No tienes permisos para asignar el rol "${role.name}" (nivel ${role.level})`,
                    );
                }
            } else {
                throw new BadRequestException(
                    'No tienes permisos para asignar roles',
                );
            }
        }
    }

    /**
     * Validar que un tema existe
     * Valida que el tema exista en la base de datos
     */
    async validateThemeExists(themeId: number): Promise<void> {
        const theme = await this.prisma.theme.findUnique({
            where: { id: themeId },
            select: {
                id: true,
                name: true,
            },
        });

        if (!theme) {
            throw new BadRequestException(
                `El tema con ID ${themeId} no existe`,
            );
        }
    }
}
