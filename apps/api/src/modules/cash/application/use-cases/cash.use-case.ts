import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { CashSessionRepositoryPort } from '../ports/cash.repository.port.js';
import { CashSession, type CashMovementType } from '../../domain/entities/cash.entity.js';
import { CASH_SESSION_REPO, TENANT_SCHEMA } from '../../cash.tokens.js';

@Injectable()
export class CashUseCases {
  constructor(
    @Inject(CASH_SESSION_REPO) private readonly sessionRepo: CashSessionRepositoryPort,
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
  ) {}

  async openSession(userId: string, dto: {
    branchCode: string;
    openingBalance: number;
  }): Promise<any> {
    const existing = await this.sessionRepo.findOpenByBranch(dto.branchCode);
    if (existing) {
      throw new BadRequestException(`Ya hay una sesión abierta en ${dto.branchCode}`);
    }

    const session = CashSession.create({
      id: 0, // se asigna en BD
      branchCode: dto.branchCode,
      userId,
      openingBalance: dto.openingBalance,
    });

    await this.sessionRepo.save(session);
    return session.toDTO();
  }

  async getOpenSession(branchCode: string): Promise<any> {
    const session = await this.sessionRepo.findOpenByBranch(branchCode);
    if (!session) throw new NotFoundException('No hay sesión abierta en esta sucursal');
    if (session.status === 'OPEN') {
      session.setExpectedBalance(await this.sessionRepo.calculateExpectedBalance(session.id));
    }
    return session.toDTO();
  }

  async getSessionById(id: number): Promise<any> {
    const session = await this.sessionRepo.findById(id);
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.status === 'OPEN') {
      session.setExpectedBalance(await this.sessionRepo.calculateExpectedBalance(id));
    }
    return session.toDTO();
  }

  async listSessions(branchCode?: string, status?: string): Promise<any[]> {
    const sessions = await this.sessionRepo.findAll(branchCode, status as any);
    return sessions.map(s => s.toDTO());
  }

  async closeSession(id: number, userId: string, dto: {
    countedBalance: number;
    notes?: string;
  }): Promise<any> {
    const session = await this.sessionRepo.findById(id);
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.userId !== userId) {
      throw new BadRequestException('Solo el usuario que abrió la sesión puede cerrarla');
    }
    if (session.status !== 'OPEN') {
      throw new BadRequestException(`La sesión está en estado ${session.status}`);
    }

    const expected = await this.sessionRepo.calculateExpectedBalance(id);
    session.setExpectedBalance(expected);

    if (Math.abs(dto.countedBalance - expected) > 0.01) {
      // Diferencia, se marca RECONCILING
    }

    session.close(dto.countedBalance, dto.notes);
    await this.sessionRepo.save(session);
    return session.toDTO();
  }

  async addMovement(id: number, userId: string, dto: {
    type: CashMovementType;
    amount: number;
    reason?: string;
  }): Promise<any> {
    const session = await this.sessionRepo.findById(id);
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.userId !== userId) {
      throw new BadRequestException('Solo el usuario de la sesión puede agregar movimientos');
    }
    if (session.status !== 'OPEN') {
      throw new BadRequestException('No se pueden agregar movimientos a sesión cerrada');
    }

    const movement = await this.sessionRepo.addMovement(id, dto.type, dto.amount, dto.reason);
    return movement.toDTO();
  }

  async getMovements(id: number): Promise<any[]> {
    const movements = await this.sessionRepo.listMovements(id);
    return movements.map(m => m.toDTO());
  }

  async getArqueo(id: number): Promise<any> {
    const session = await this.sessionRepo.findById(id);
    if (!session) throw new NotFoundException('Sesión no encontrada');
    const movements = await this.sessionRepo.listMovements(id);
    const expected = await this.sessionRepo.calculateExpectedBalance(id);
    return {
      sessionId: id,
      branchCode: session.branchCode,
      status: session.status,
      openingBalance: session.openingBalance,
      expectedBalance: expected,
      movements: movements.map(m => m.toDTO()),
      summary: {
        sales: movements.filter(m => m.type === 'SALE').reduce((s, m) => s + m.amount, 0),
        ins: movements.filter(m => m.type === 'IN').reduce((s, m) => s + m.amount, 0),
        outs: movements.filter(m => m.type === 'OUT').reduce((s, m) => s + m.amount, 0),
        refunds: movements.filter(m => m.type === 'REFUND').reduce((s, m) => s + m.amount, 0),
      },
    };
  }
}