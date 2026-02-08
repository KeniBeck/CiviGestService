import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAgente = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Datos del agente desde JWT
  },
);
