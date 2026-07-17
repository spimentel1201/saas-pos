import type { CashSession, CashMovement, CashSessionStatus, CashMovementType } from '../../domain/entities/cash.entity.js';

export interface CashSessionRepositoryPort {
  save(session: CashSession): Promise<CashSession>;
  findById(id: number): Promise<CashSession | null>;
  findOpenByBranch(branchCode: string): Promise<CashSession | null>;
  findAll(branchCode?: string, status?: CashSessionStatus): Promise<CashSession[]>;
  addMovement(sessionId: number, type: CashMovementType, amount: number, reason?: string): Promise<CashMovement>;
  listMovements(sessionId: number): Promise<CashMovement[]>;
}

export const CASH_SESSION_REPO = Symbol('CASH_SESSION_REPO');
export const TENANT_SCHEMA = Symbol('TENANT_SCHEMA');