import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { ConflictError } from '../../../../shared/domain/errors/domain-error.js';
import {
  type MovementDTO,
  Stock,
  type StockDTO,
  type TransferDTO,
  type TransferItem,
} from '../../domain/entities/stock.entity.js';
import { computeWeightedAvgCost } from '../../domain/services/avg-cost.service.js';
import { STOCK_REPO, TENANT_SCHEMA, TRANSFER_REPO } from '../../inventory.tokens.js';
import type {
  StockRepositoryPort,
  TransferRepositoryPort,
} from '../ports/inventory.repository.port.js';

@Injectable()
export class InventoryUseCases {
  constructor(
    @Inject(STOCK_REPO) private readonly stockRepo: StockRepositoryPort,
    @Inject(TRANSFER_REPO) private readonly transferRepo: TransferRepositoryPort,
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
  ) {}

  // ---- Consulta ----

  async getByBranchProduct(branchCode: string, productId: string): Promise<StockDTO> {
    const stock = await this.stockRepo.findByBranchProduct(branchCode, productId);
    if (!stock) throw new NotFoundException('Stock no encontrado');
    return stock.toDTO();
  }

  async listByBranch(branchCode: string): Promise<StockDTO[]> {
    const stocks = await this.stockRepo.findByBranch(branchCode);
    return stocks.map((s) => s.toDTO());
  }

  async listByProduct(productId: string): Promise<StockDTO[]> {
    const stocks = await this.stockRepo.findByProduct(productId);
    return stocks.map((s) => s.toDTO());
  }

  async getLowStock(branchCode?: string): Promise<StockDTO[]> {
    const stocks = await this.stockRepo.findLowStock(branchCode);
    return stocks.map((s) => s.toDTO());
  }

  async getMovements(branchCode: string, productId: string, limit = 100): Promise<MovementDTO[]> {
    const stock = await this.stockRepo.findByBranchProduct(branchCode, productId);
    if (!stock) throw new NotFoundException('Stock no encontrado');
    const movements = await this.stockRepo.listMovements(stock.id, limit);
    return movements.map((m) => m.toDTO());
  }

  // ---- Ajustes ----

  async adjust(
    branchCode: string,
    productId: string,
    userId: string,
    dto: {
      newQty?: number;
      delta?: number;
      reason?: string;
      minQty?: number;
      maxQty?: number;
    },
  ): Promise<StockDTO> {
    if (dto.newQty === undefined && dto.delta === undefined) {
      throw new BadRequestException('Se requiere newQty o delta');
    }
    // ensureOrCreate valida que la sucursal pertenezca al negocio
    let stock = await this.ensureOrCreate(branchCode, productId);

    let delta: number;
    if (dto.delta !== undefined) {
      delta = dto.delta;
    } else {
      delta = (dto.newQty ?? 0) - stock.qty;
    }

    if (delta !== 0) {
      stock.applyDelta(delta);
      // upsert devuelve la fila con su id real (0 en filas nuevas).
      // Capturarlo es obligatorio: addMovement necesita ese id por la FK.
      stock = await this.stockRepo.upsert(stock);
      await this.stockRepo.addMovement({
        stockId: stock.id,
        type: 'ADJUSTMENT',
        delta,
        reason: dto.reason ?? 'Ajuste de inventario',
        branchCode,
        userId,
      });
    }

    if (dto.minQty !== undefined || dto.maxQty !== undefined) {
      stock.updateMinMax(dto.minQty ?? stock.minQty, dto.maxQty ?? stock.maxQty);
      stock = await this.stockRepo.upsert(stock);
    }

    return stock.toDTO();
  }

  // ---- Transferencias ----

  async createTransfer(
    userId: string,
    dto: {
      fromBranch: string;
      toBranch: string;
      items: TransferItem[];
    },
  ): Promise<TransferDTO> {
    // Las transferencias solo pueden moverse entre sucursales del negocio
    await this.requireBranch(dto.fromBranch);
    await this.requireBranch(dto.toBranch);

    // Validar stock suficiente en sucursal origen
    for (const item of dto.items) {
      const stock = await this.stockRepo.findByBranchProduct(dto.fromBranch, item.productId);
      if (!stock || stock.available < item.qty) {
        throw new BadRequestException(
          `Stock insuficiente para producto ${item.productId} en ${dto.fromBranch}`,
        );
      }
    }

    const transfer = await this.transferRepo.save(
      (await import('../../domain/entities/stock.entity.js')).StockTransfer.create({
        id: ulid(),
        fromBranch: dto.fromBranch,
        toBranch: dto.toBranch,
        items: dto.items,
        createdBy: userId,
      }),
    );
    return transfer.toDTO();
  }

  async shipTransfer(id: string, userId: string): Promise<TransferDTO> {
    const transfer = await this.requireTransfer(id);
    transfer.ship();
    await this.transferRepo.save(transfer);

    // Descontar stock de la sucursal origen
    for (const item of transfer.items) {
      const stock = await this.stockRepo.findByBranchProduct(transfer.fromBranch, item.productId);
      if (stock) {
        stock.applyDelta(-item.qty);
        await this.stockRepo.upsert(stock);
        await this.stockRepo.addMovement({
          stockId: stock.id,
          type: 'TRANSFER',
          delta: -item.qty,
          reason: `Transferencia ${transfer.id} a ${transfer.toBranch}`,
          ref: transfer.id,
          branchCode: transfer.fromBranch,
          userId,
        });
      }
    }

    return transfer.toDTO();
  }

  async receiveTransfer(
    id: string,
    userId: string,
    unitCosts?: Record<string, number>,
  ): Promise<TransferDTO> {
    const transfer = await this.requireTransfer(id);
    transfer.receive();
    await this.transferRepo.save(transfer);

    for (const item of transfer.items) {
      let stock = await this.ensureOrCreate(transfer.toBranch, item.productId);
      const unitCost = unitCosts?.[item.productId] ?? stock.avgCost;
      const newAvgCost = computeWeightedAvgCost(stock.qty, stock.avgCost, item.qty, unitCost);
      stock.applyDelta(item.qty, newAvgCost);
      stock = await this.stockRepo.upsert(stock);
      await this.stockRepo.addMovement({
        stockId: stock.id,
        type: 'TRANSFER',
        delta: item.qty,
        reason: `Transferencia ${transfer.id} desde ${transfer.fromBranch}`,
        ref: transfer.id,
        branchCode: transfer.toBranch,
        userId,
      });
    }

    return transfer.toDTO();
  }

  async cancelTransfer(id: string, _userId: string): Promise<TransferDTO> {
    const transfer = await this.requireTransfer(id);
    transfer.cancel();
    await this.transferRepo.save(transfer);
    return transfer.toDTO();
  }

  async listTransfers(status?: string): Promise<TransferDTO[]> {
    const transfers = await this.transferRepo.findAll(status);
    return transfers.map((t) => t.toDTO());
  }

  // ---- Internos ----

  /** Rechaza sucursales que no pertenezcan al negocio (o inactivas). */
  private async requireBranch(branchCode: string): Promise<void> {
    if (branchCode && !(await this.stockRepo.branchExists(branchCode))) {
      throw new ConflictError(
        `La sucursal ${branchCode} no existe o no está activa en este negocio.`,
      );
    }
  }

  private async ensureOrCreate(branchCode: string, productId: string): Promise<Stock> {
    await this.requireBranch(branchCode);
    let stock = await this.stockRepo.findByBranchProduct(branchCode, productId);
    if (!stock) {
      stock = Stock.rehydrate({
        id: 0,
        branchCode,
        productId,
        qty: 0,
        reserved: 0,
        minQty: 0,
        maxQty: 0,
        avgCost: 0,
        version: 1,
        updatedAt: new Date(),
      });
    }
    return stock;
  }

  private async requireTransfer(id: string) {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    return transfer;
  }
}
