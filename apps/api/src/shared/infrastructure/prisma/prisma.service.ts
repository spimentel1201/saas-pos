import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Acceso a la base de datos compartida (`public` schema):
 * tenants, users, tenant_users, subscriptions, usage_counters,
 * idempotency_records, audit_log.
 *
 * Usa el driver adapter @prisma/adapter-pg (recomendado por Prisma 7+).
 * Ver `.agents/skills/prisma-database-setup/SKILL.md`.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_URL ??
          'postgresql://postgres:postgres@localhost:5432/pos_saas?schema=public',
      }),
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
