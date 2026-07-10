import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (
    data: keyof { sub: string; email: string; tenantId?: string; role?: string } | undefined,
    ctx: ExecutionContext,
  ) => {
    const req = ctx
      .switchToHttp()
      .getRequest<{ user: { sub: string; email: string; tenantId?: string; role?: string } }>();
    return data ? req.user[data] : req.user;
  },
);
