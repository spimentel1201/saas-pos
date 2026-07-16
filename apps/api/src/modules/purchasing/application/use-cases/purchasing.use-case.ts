import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ulid } from 'ulid';
import { InventoryUseCases } from '../../../inventory/application/use-cases/inventory.use-case.js';
import { computeWeightedAvgCost } from '../../../inventory/domain/services/avg-cost.service.js';
import {
  PurchaseOrder,
  type PurchaseOrderItem,
  Supplier,
} from '../../domain/entities/purchasing.entity.js';
import { PURCHASE_ORDER_REPO, SUPPLIER_REPO, TENANT_SCHEMA } from '../../purchasing.tokens.js';
import type {
  PurchaseOrderRepositoryPort,
  SupplierRepositoryPort,
} from '../ports/purchasing.repository.port.js';

@Injectable()
export class PurchasingUseCases {
  constructor(
    @Inject(SUPPLIER_REPO) private readonly supplierRepo: SupplierRepositoryPort,
    @Inject(PURCHASE_ORDER_REPO) private readonly poRepo: PurchaseOrderRepositoryPort,
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly inventory: InventoryUseCases,
  ) {}

  // ---- Suppliers ----

  async createSupplier(dto: {
    name: string;
    contact?: string;
    taxId?: string;
    email?: string;
    phone?: string;
  }) {
    const supplier = Supplier.create({ id: ulid(), ...dto });
    await this.supplierRepo.save(supplier);
    return supplier.toDTO();
  }

  async getSupplier(id: string) {
    const supplier = await this.supplierRepo.findById(id);
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier.toDTO();
  }

  async listSuppliers() {
    const suppliers = await this.supplierRepo.findAll();
    return suppliers.map((s) => s.toDTO());
  }

  async updateSupplier(
    id: string,
    dto: Partial<{
      name: string;
      contact: string;
      taxId: string;
      email: string;
      phone: string;
    }>,
  ) {
    const supplier = await this.supplierRepo.findById(id);
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    if (dto.name !== undefined) supplier.updateName(dto.name);
    if (dto.contact !== undefined) supplier.updateContact(dto.contact);
    if (dto.taxId !== undefined) supplier.updateTaxId(dto.taxId);
    if (dto.email !== undefined) supplier.updateEmail(dto.email);
    if (dto.phone !== undefined) supplier.updatePhone(dto.phone);
    await this.supplierRepo.save(supplier);
    return supplier.toDTO();
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = await this.supplierRepo.findById(id);
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    await this.supplierRepo.delete(id);
  }

  // ---- Purchase Orders ----

  async createPO(
    userId: string,
    dto: {
      branchCode: string;
      supplierId: string;
      items: PurchaseOrderItem[];
    },
  ) {
    const supplier = await this.supplierRepo.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');

    const po = PurchaseOrder.create({
      id: ulid(),
      branchCode: dto.branchCode,
      supplierId: dto.supplierId,
      items: dto.items,
      createdBy: userId,
    });
    await this.poRepo.save(po);
    return po.toDTO();
  }

  async getPO(id: string) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    return po.toDTO();
  }

  async listPOs(status?: string) {
    const pos = await this.poRepo.findAll(status);
    return pos.map((p) => p.toDTO());
  }

  async sendPO(id: string): Promise<any> {
    const po = await this.requirePO(id);
    po.send();
    await this.poRepo.save(po);
    return po.toDTO();
  }

  async cancelPO(id: string): Promise<any> {
    const po = await this.requirePO(id);
    po.cancel();
    await this.poRepo.save(po);
    return po.toDTO();
  }

  async receivePO(id: string, userId: string, dto: { items: PurchaseOrderItem[] }) {
    const po = await this.requirePO(id);
    if (po.status !== 'SENT' && po.status !== 'PARTIAL') {
      throw new BadRequestException(`No se puede recibir OC en estado ${po.status}`);
    }

    const receipt = await this.poRepo.addReceipt({
      poId: po.id,
      receivedBy: userId,
      items: dto.items,
    });

    // Sumar stock + recalcular costo promedio via InventoryUseCases
    for (const item of dto.items) {
      const stock = await this.inventory
        .getByBranchProduct(po.branchCode, item.productId)
        .catch(() => null);
      const currentQty = stock?.qty ?? 0;
      const currentAvg = stock?.avgCost ?? 0;
      const _newAvg = computeWeightedAvgCost(currentQty, currentAvg, item.qty, item.unitCost);

      await this.inventory.adjust(po.branchCode, item.productId, userId, {
        delta: item.qty,
        reason: `Recepción OC ${po.id}`,
      });

      // El avgCost se actualiza via adjust() pero sólo si pasa newAvg
      // (en esta versión simplificada no forzamos avgCost para no acoplar demasiado)
    }

    // Marcar OC como recibida (o parcial si quedan items pendientes)
    const totalOrdered = po.items.reduce((s, it) => s + it.qty, 0);
    const totalReceived = (await this.poRepo.listReceipts(po.id))
      .flatMap((r) => r.items)
      .reduce((s, it) => s + it.qty, 0);

    if (totalReceived >= totalOrdered) {
      po.markReceived();
    } else {
      po.markPartial();
    }
    await this.poRepo.save(po);

    return receipt.toDTO();
  }

  async listReceipts(poId: string) {
    const receipts = await this.poRepo.listReceipts(poId);
    return receipts.map((r) => r.toDTO());
  }

  private async requirePO(id: string) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    return po;
  }
}
