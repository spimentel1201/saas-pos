import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import { TenantContext, type TenantInfo } from '../multi-tenant/tenant-context.js';

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantInfo | undefined, _ctx: ExecutionContext) => {
    const tenant = TenantContext.current;
    return data && tenant ? tenant[data] : tenant;
  },
);
