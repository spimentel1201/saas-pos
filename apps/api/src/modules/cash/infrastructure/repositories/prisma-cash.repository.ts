import { Inject, Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type { CashSessionRepositoryPort } from '../../application/ports/cash.repository.port.js';
import { TENANT_SCHEMA } from '../../cash.tokens.js';
import {
  CashMovement,
  type CashMovementType,
  CashSession,
  type CashSessionStatus,
} from '../../domain/entities/cash.entity.js';

@Injectable()
export class PrismaCashSessionRepository implements CashSessionRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async save(session: CashSession): Promise<CashSession> {
    const dto = session.toDTO();
    return this.tenantPrisma.withTenant(async (tx) => {
      const existing = await tx.$queryRawUnsafe<{ id: number }[]>(
        'SELECT id FROM cash_sessions WHERE id = $1',
        dto.id,
      );
      if (existing.length > 0) {
        await tx.$executeRawUnsafe(
          `UPDATE cash_sessions SET branch_code = $1, user_id = $2, opened_at = $3, closed_at = $4,
           opening_balance = $5, expected_balance = $6, counted_balance = $7, difference = $8,
           status = $9, notes = $10
           WHERE id = $11`,
          dto.branchCode,
          dto.userId,
          dto.openedAt,
          dto.closedAt ?? null,
          dto.openingBalance,
          dto.expectedBalance,
          dto.countedBalance ?? null,
          dto.difference ?? null,
          dto.status,
          dto.notes ?? null,
          dto.id,
        );
      } else {
        const inserted = await tx.$queryRawUnsafe<{ id: number }[]>(
          `INSERT INTO cash_sessions (branch_code, user_id, opened_at, opening_balance, expected_balance, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          dto.branchCode,
          dto.userId,
          dto.openedAt,
          dto.openingBalance,
          dto.expectedBalance,
          dto.status,
          dto.notes ?? null,
        );
        if (inserted.length > 0 && inserted[0]) {
          return CashSession.rehydrate({ ...dto, id: Number(inserted[0].id) });
        }
      }
      return session;
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries return untyped rows
  private queryRow<T>(tx: any, sql: string, ...args: unknown[]): Promise<T[]> {
    return tx.$queryRawUnsafe(sql, ...args);
  }

  async findById(id: number): Promise<CashSession | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, branch_code, user_id, opened_at, closed_at, opening_balance,
                expected_balance, counted_balance, difference, status, notes
         FROM cash_sessions WHERE id = $1`,
        id,
      );
      return rows.length > 0 ? this.mapToSession(rows[0]) : null;
    });
  }

  async findOpenByBranch(branchCode: string): Promise<CashSession | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, branch_code, user_id, opened_at, closed_at, opening_balance,
                expected_balance, counted_balance, difference, status, notes
         FROM cash_sessions WHERE branch_code = $1 AND status = 'OPEN'
         ORDER BY opened_at DESC LIMIT 1`,
        branchCode,
      );
      return rows.length > 0 ? this.mapToSession(rows[0]) : null;
    });
  }

  async findAll(branchCode?: string, status?: CashSessionStatus): Promise<CashSession[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = [];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic params for raw SQL
      const params: any[] = [];
      let idx = 1;

      if (branchCode) {
        conditions.push(`branch_code = $${idx++}`);
        params.push(branchCode);
      }
      if (status) {
        conditions.push(`status = $${idx++}`);
        params.push(status);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, branch_code, user_id, opened_at, closed_at, opening_balance,
                expected_balance, counted_balance, difference, status, notes
         FROM cash_sessions ${where} ORDER BY opened_at DESC`,
        ...params,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToSession(r));
    });
  }

  async addMovement(
    sessionId: number,
    type: CashMovementType,
    amount: number,
    reason?: string,
  ): Promise<CashMovement> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `INSERT INTO cash_movements (session_id, type, amount, reason, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, session_id, type, amount, reason, created_at`,
        sessionId,
        type,
        amount,
        reason ?? null,
      );
      return this.mapToMovement(rows[0]);
    });
  }

  async listMovements(sessionId: number): Promise<CashMovement[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, session_id, type, amount, reason, created_at
         FROM cash_movements WHERE session_id = $1 ORDER BY created_at ASC`,
        sessionId,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToMovement(r));
    });
  }

  async calculateExpectedBalance(sessionId: number): Promise<number> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const sessionRows = await tx.$queryRawUnsafe<{ opening_balance: number }[]>(
        'SELECT opening_balance FROM cash_sessions WHERE id = $1',
        sessionId,
      );
      if (sessionRows.length === 0 || !sessionRows[0]) return 0;
      const opening = Number(sessionRows[0].opening_balance);

      const agg = await tx.$queryRawUnsafe<{ type: string; sum: number }[]>(
        `SELECT type, SUM(amount) as sum
         FROM cash_movements WHERE session_id = $1
         GROUP BY type`,
        sessionId,
      );

      let result = opening;
      for (const row of agg) {
        const amt = Number(row.sum);
        if (row.type === 'SALE' || row.type === 'IN') result += amt;
        else if (row.type === 'OUT' || row.type === 'REFUND') result -= amt;
      }
      return Math.round(result * 10000) / 10000;
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToSession(row: any): CashSession {
    return CashSession.rehydrate({
      id: Number(row.id),
      branchCode: row.branch_code,
      userId: row.user_id,
      openedAt: new Date(row.opened_at),
      closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
      openingBalance: Number(row.opening_balance),
      expectedBalance: Number(row.expected_balance),
      countedBalance: row.counted_balance !== null ? Number(row.counted_balance) : undefined,
      difference: row.difference !== null ? Number(row.difference) : undefined,
      status: row.status,
      notes: row.notes ?? undefined,
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToMovement(row: any): CashMovement {
    return CashMovement.rehydrate({
      id: Number(row.id),
      sessionId: Number(row.session_id),
      type: row.type,
      amount: Number(row.amount),
      reason: row.reason ?? undefined,
      createdAt: new Date(row.created_at),
    });
  }
}
