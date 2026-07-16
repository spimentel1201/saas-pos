import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import {
  CreatePurchaseOrderDto,
  CreateSupplierDto,
  ReceivePurchaseOrderDto,
  UpdateSupplierDto,
} from '../../application/dtos/purchasing.dto.js';
import { PurchasingUseCases } from '../../application/use-cases/purchasing.use-case.js';

@ApiTags('purchasing')
@ApiBearerAuth('access-token')
@Controller('purchasing')
@TenantRequired()
export class PurchasingController {
  constructor(private readonly purchasingUseCases: PurchasingUseCases) {}

  // ---- Suppliers ----

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear proveedor' })
  async createSupplier(@Body() dto: CreateSupplierDto) {
    return this.purchasingUseCases.createSupplier(dto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Listar proveedores' })
  async listSuppliers() {
    return this.purchasingUseCases.listSuppliers();
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Obtener proveedor' })
  async getSupplier(@Param('id') id: string) {
    return this.purchasingUseCases.getSupplier(id);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  async updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.purchasingUseCases.updateSupplier(id, dto);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar proveedor' })
  async deleteSupplier(@Param('id') id: string) {
    await this.purchasingUseCases.deleteSupplier(id);
  }

  // ---- Purchase Orders ----

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear orden de compra' })
  async createPO(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchasingUseCases.createPO('system', dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELED'],
  })
  async listPOs(@Query('status') status?: string) {
    return this.purchasingUseCases.listPOs(status);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Obtener orden de compra' })
  async getPO(@Param('id') id: string) {
    return this.purchasingUseCases.getPO(id);
  }

  @Patch('orders/:id/send')
  @ApiOperation({ summary: 'Enviar orden de compra al proveedor' })
  async sendPO(@Param('id') id: string) {
    return this.purchasingUseCases.sendPO(id);
  }

  @Patch('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancelar orden de compra' })
  async cancelPO(@Param('id') id: string) {
    return this.purchasingUseCases.cancelPO(id);
  }

  @Post('orders/:id/receive')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Recibir mercancía de OC (suma stock + ajusta costo promedio)' })
  async receivePO(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto) {
    return this.purchasingUseCases.receivePO(id, 'system', dto);
  }

  @Get('orders/:id/receipts')
  @ApiOperation({ summary: 'Listar recepciones de una OC' })
  async listReceipts(@Param('id') id: string) {
    return this.purchasingUseCases.listReceipts(id);
  }
}
