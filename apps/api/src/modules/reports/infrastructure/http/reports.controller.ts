import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { CashReportUseCases } from '../../application/use-cases/cash-report.use-case.js';
import { CategorySalesUseCases } from '../../application/use-cases/category-sales.use-case.js';
import { DailySalesUseCases } from '../../application/use-cases/daily-sales.use-case.js';
import { DashboardUseCases } from '../../application/use-cases/dashboard.use-case.js';
import { InventoryValuationUseCases } from '../../application/use-cases/inventory-valuation.use-case.js';
import { ProductSalesUseCases } from '../../application/use-cases/product-sales.use-case.js';
import {
  cashReportTemplate,
  categorySalesTemplate,
  dailySalesTemplate,
  inventoryValuationTemplate,
} from '../templates/excel-templates.js';

@ApiTags('reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@TenantRequired()
export class ReportsController {
  constructor(
    private readonly dashboardUseCases: DashboardUseCases,
    private readonly dailySalesUseCases: DailySalesUseCases,
    private readonly productSalesUseCases: ProductSalesUseCases,
    private readonly categorySalesUseCases: CategorySalesUseCases,
    private readonly inventoryValuationUseCases: InventoryValuationUseCases,
    private readonly cashReportUseCases: CashReportUseCases,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs del dashboard' })
  async getDashboard() {
    return this.dashboardUseCases.getKPIs();
  }

  @Get('dashboard/heatmap')
  @ApiOperation({ summary: 'Heatmap de ventas por hora' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getHeatmap(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardUseCases.getHourlyHeatmap({ branchId, from, to });
  }

  @Get('sales/daily')
  @ApiOperation({ summary: 'Ventas diarias' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getDailySales(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dailySalesUseCases.execute({ branchId, from, to });
  }

  @Get('sales/by-product')
  @ApiOperation({ summary: 'Ventas por producto (top productos)' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSalesByProduct(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
  ) {
    return this.productSalesUseCases.execute({ branchId, from, to, limit });
  }

  @Get('sales/by-category')
  @ApiOperation({ summary: 'Ventas por categoria' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getSalesByCategory(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.categorySalesUseCases.execute({ branchId, from, to });
  }

  @Get('inventory/valuation')
  @ApiOperation({ summary: 'Inventario valorizado' })
  @ApiQuery({ name: 'branchId', required: false })
  async getInventoryValuation(@Query('branchId') branchId?: string) {
    return this.inventoryValuationUseCases.execute(branchId);
  }

  @Get('cash')
  @ApiOperation({ summary: 'Reporte de caja' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getCashReport(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.cashReportUseCases.execute({ branchId, from, to });
  }

  @Get('export/:type')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOperation({ summary: 'Exportar reporte a Excel' })
  @ApiParam({ name: 'type', enum: ['daily-sales', 'by-category', 'inventory', 'cash'] })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async exportExcel(
    @Param('type') type: string,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    let workbook: import('exceljs').Workbook;
    let filename: string;

    const filter = { branchId, from, to };

    switch (type) {
      case 'daily-sales': {
        const data = await this.dailySalesUseCases.execute(filter);
        workbook = dailySalesTemplate(data);
        filename = 'ventas-diarias.xlsx';
        break;
      }
      case 'by-category': {
        const data = await this.categorySalesUseCases.execute(filter);
        workbook = categorySalesTemplate(data);
        filename = 'ventas-por-categoria.xlsx';
        break;
      }
      case 'inventory': {
        const data = await this.inventoryValuationUseCases.execute(branchId);
        workbook = inventoryValuationTemplate(data);
        filename = 'inventario-valorizado.xlsx';
        break;
      }
      case 'cash': {
        const data = await this.cashReportUseCases.execute(filter);
        workbook = cashReportTemplate(data);
        filename = 'reporte-caja.xlsx';
        break;
      }
      default:
        res?.status(400).json({ message: `Tipo de exportacion no soportado: ${type}` });
        return;
    }

    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (res) {
      await workbook.xlsx.write(res);
      res.end();
    }
  }
}
