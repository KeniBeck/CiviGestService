import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para marcar rutas como públicas (no requieren autenticación)
 * @example
 * @Public()
 * @Get('public-endpoint')
 * getPublicData() {}
 */
export const Public = () => SetMetadata('isPublic', true);
