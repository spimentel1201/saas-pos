import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../../shared/infrastructure/http/current-tenant.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import {
  AdjustStockDto,
  CreateTransferDto,
  ReceiveTransferDto,
} from '../../application/dtos/inventory.dto.js';
import { InventoryUseCases } from '../../application/use-cases/inventory.use-case.js';

@ApiTags('inventory')
@ApiBearerAuth('access-token')
@Controller('inventory')
@TenantRequired()
export class InventoryController {
  constructor(private readonly inventoryUseCases: InventoryUseCases) {}

  // ---- Stock ----

  @Get('stock/:branchCode/:productId')
  @ApiOperation({ summary: 'Obtener stock por sucursal y producto' })
  async getStock(@Param('branchCode') branchCode: string, @Param('productId') productId: string) {
    return this.inventoryUseCases.getByBranchProduct(branchCode, productId);
  }

  @Get('stock/:branchCode')
  @ApiOperation({ summary: 'Listar stock por sucursal' })
  async listByBranch(@Param('branchCode') branchCode: string) {
    return this.inventoryUseCases.listByBranch(branchCode);
  }

  @Get('stock/product/:productId')
  @ApiOperation({ summary: 'Listar stock de un producto en todas las sucursales' })
  async listByProduct(@Param('productId') productId: string) {
    return this.inventoryUseCases.listByProduct(productId);
  }

  @Get('stock/low/all')
  @ApiOperation({ summary: 'Productos con stock bajo' })
  @ApiQuery({ name: 'branchCode', required: false })
  async getLowStock(@Query('branchCode') branchCode?: string) {
    return this.inventoryUseCases.getLowStock(branchCode);
  }

  @Get('movements/:branchCode/:productId')
  @ApiOperation({ summary: 'Historial de movimientos de stock' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMovements(
    @Param('branchCode') branchCode: string,
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryUseCases.getMovements(branchCode, productId, limit);
  }

  @Patch('stock/:branchCode/:productId/adjust')
  @ApiOperation({ summary: 'Ajustar stock (conteo cíclico)' })
  async adjustStock(
    @Param('branchCode') branchCode: string,
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentTenant() _tenant: { id: string },
  ) {
    // userId temporal 'system' hasta integrar @CurrentUser
    return this.inventoryUseCases.adjust(branchCode, productId, 'system', dto);
  }

  // ---- Transferencias ----

  @Post('transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear transferencia entre sucursales' })
  async createTransfer(@Body() dto: CreateTransferDto) {
    return this.inventoryUseCases.createTransfer('system', dto);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Listar transferencias' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'SHIPPED', 'RECEIVED', 'CANCELED'],
  })
  async listTransfers(@Query('status') status?: string) {
    return this.inventoryUseCases.listTransfers(status);
  }

  @Get('transfers/:id')
  @ApiOperation({ summary: 'Obtener transferencia' })
  async getTransfer(@Param('id') id: string) {
    return this.inventoryUseCases.listTransfers().then((ts) => ts.find((t) => t.id === id));
  }

  @Patch('transfers/:id/ship')
  @ApiOperation({ summary: 'Marcar transferencia como enviada' })
  async shipTransfer(@Param('id') id: string) {
    return this.inventoryUseCases.shipTransfer(id, 'system');
  }

  @Patch('transfers/:id/receive')
  @ApiOperation({ summary: 'Recibir transferencia (suma stock + recalc costo promedio)' })
  async receiveTransfer(@Param('id') id: string, @Body() dto: ReceiveTransferDto) {
    return this.inventoryUseCases.receiveTransfer(id, 'system', dto?.unitCosts);
  }

  @Patch('transfers/:id/cancel')
  @ApiOperation({ summary: 'Cancelar transferencia' })
  async cancelTransfer(@Param('id') id: string) {
    return this.inventoryUseCases.cancelTransfer(id, 'system');
  }
}
