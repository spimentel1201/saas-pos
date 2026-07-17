import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ulid } from 'ulid';
import type { SaleRepositoryPort, CheckoutInput, ReturnInput, SaleFilter, PaginatedSales } from '../ports/sale.repository.port.js';
import { Sale, SaleItem, SalePayment, SaleReturn, type PaymentMethod, type SaleStatus } from '../../domain/entities/sale.entity.js';
import { computeSaleTotals, computeNumberSeq } from '../../domain/services/sale-calculator.service.js';
import { SALE_REPO, TENANT_SCHEMA } from '../../sales.tokens.js';
import { InventoryUseCases } from '../../../inventory/application/use-cases/inventory.use-case.js';

@Injectable()
export class SalesUseCases {
  constructor(
    @Inject(SALE_REPO) private readonly saleRepo: SaleRepositoryPort,
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly inventory: InventoryUseCases,
  ) {}

  async checkout(userId: string, dto: {
    branchCode: string;
    customerId?: string;
    cashierSessionId?: number;
    items: { productId: string; variantId?: string; qty: number; unitPrice: number; taxRate?: number; discount?: number }[];
    payments: { method: PaymentMethod; amount: number; ref?: string }[];
    meta?: Record<string, unknown>;
  }) {
    if (dto.items.length === 0) throw new BadRequestException('El carrito está vacío');
    if (dto.payments.length === 0) throw new BadRequestException('Debe especificar al menos un método de pago');

    const totalPayments = dto.payments.reduce((s, p) => s + p.amount, 0);
    const saleItems = dto.items.map(i => SaleItem.create({
      productId: i.productId,
      variantId: i.variantId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      taxRate: i.taxRate,
      discount: i.discount,
    }));

    const totals = computeSaleTotals(saleItems, 0);
    if (Math.abs(totalPayments - totals.total) > 0.01) {
      throw new BadRequestException(`Total de pagos (${totalPayments}) no coincide con total de venta (${totals.total})`);
    }

    // Verificar stock disponible
    for (const item of saleItems) {
      const stock = await this.inventory.getByBranchProduct(dto.branchCode, item.productId).catch(() => null);
      const available = stock?.available ?? 0;
      if (available < item.qty) {
        throw new BadRequestException(`Stock insuficiente para ${item.productId}: disponible ${available}, solicitado ${item.qty}`);
      }
    }

    const numberSeq = await this.saleRepo.nextNumberSeq(dto.branchCode, new Date());

    const input: CheckoutInput = {
      saleId: ulid(),
      branchCode: dto.branchCode,
      userId,
      cashierSessionId: dto.cashierSessionId,
      customerId: dto.customerId,
      items: saleItems,
      payments: dto.payments,
      totals: { ...totals, numberSeq },
      meta: dto.meta,
    };

    return this.saleRepo.checkout(input);
  }

  async getById(id: string) {
    const sale = await this.saleRepo.findById(id);
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale.toDTO();
  }

  async search(userId: string, filter: SaleFilter): Promise<PaginatedSales> {
    return this.saleRepo.findAll(filter);
  }

  async voidSale(id: string) {
    const sale = await this.saleRepo.findById(id);
    if (!sale) throw new NotFoundException('Venta no encontrada');
    sale.voidSale();
    await this.saleRepo.voidSale(id);
    return { id, status: 'VOID' };
  }

  async createReturn(userId: string, dto: {
    saleId: string;
    reason?: string;
    items: { productId: string; variantId?: string; qty: number; unitPrice: number; taxRate?: number; discount?: number }[];
  }) {
    const sale = await this.saleRepo.findById(dto.saleId);
    if (!sale) throw new NotFoundException('Venta no encontrada');
    if (sale.status === 'VOID') throw new BadRequestException('La venta está anulada, no se puede devolver');

    const returnItems = dto.items.map(i => SaleItem.create({
      productId: i.productId,
      variantId: i.variantId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      taxRate: i.taxRate,
      discount: i.discount,
    }));

    // Sumar stock de vuelta
    for (const item of returnItems) {
      await this.inventory.adjust(sale.branchCode, item.productId, userId, {
        delta: item.qty,
        reason: `Devolución venta ${dto.saleId}`,
      });
    }

    const returnInput: ReturnInput = {
      returnId: ulid(),
      saleId: dto.saleId,
      reason: dto.reason,
      items: returnItems,
      total: returnItems.reduce((s, i) => s + i.total, 0),
    };

    const returnEntity = await this.saleRepo.registerReturn(returnInput);

    // Actualizar estado venta
    const returnTotal = returnInput.total;
    const originalTotal = sale.total;
    if (Math.abs(returnTotal - originalTotal) < 0.01) {
      sale.markReturned();
    } else {
      sale.markPartialReturn();
    }
    // Nota: en una implementación completa se guardaría el estado actualizado

    return returnEntity.toDTO();
  }

  async listReturns(saleId: string) {
    const returns = await this.saleRepo.listReturns(saleId);
    return returns.map(r => r.toDTO());
  }
}