import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JWTPayload } from '../types';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): JWTPayload | undefined => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
