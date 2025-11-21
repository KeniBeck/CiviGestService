import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../interfaces/jwt-payload.interface';

/**
 * Decorador para obtener el usuario autenticado del request
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   return user;
 * }
 * 
 * // O extraer un campo específico
 * @Get('tenant')
 * getTenant(@CurrentUser('tenantId') tenantId: number) {
 *   return tenantId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    return data ? user?.[data] : user;
  },
);
