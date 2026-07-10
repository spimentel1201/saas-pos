import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../multi-tenant/tenant-context.js';

type TxClient = Omit<
  PrismaClient,
  '$on' | '$connect' | '$disconnect' | '$transaction' | '$extends'
>;

@Injectable()
export class TenantPrismaService extends PrismaClient {
  constructor(private readonly ctx: TenantContext) {
    super({
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_URL ??
          'postgresql://postgres:postgres@localhost:5432/pos_saas?schema=public',
      }),
      log: ['error'],
    });
  }

  async withTenant<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    const schema = this.ctx.requireSchemaName();
    const result = await this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}", public`);
      return fn(tx as unknown as TxClient);
    });
    return result as unknown as T;
  }
}
