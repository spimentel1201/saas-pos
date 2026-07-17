import { describe, expect, it } from 'vitest';
import {
  dailySalesTemplate,
  categorySalesTemplate,
  inventoryValuationTemplate,
  cashReportTemplate,
} from './excel-templates.js';
import type {
  DailySalesReport,
  CategorySalesReport,
  InventoryValuationReport,
  CashSummaryReport,
} from '../../domain/entities/report.entities.js';

describe('Excel Templates', () => {
  describe('dailySalesTemplate', () => {
    it('creates a workbook with daily sales data', () => {
      const data: DailySalesReport[] = [
        {
          branchId: 'branch_1',
          branchName: 'Sucursal Principal',
          day: new Date('2024-01-15'),
          productId: 'prod_1',
          productName: 'Producto A',
          categoryId: 'cat_1',
          categoryName: 'Categoria 1',
          userId: 'user_1',
          salesCount: 10,
          qtySold: 50,
          grossTotal: 1500,
          grossProfit: 300,
        },
      ];

      const workbook = dailySalesTemplate(data);

      expect(workbook).toBeDefined();
      expect(workbook.worksheets).toHaveLength(1);

      const sheet = workbook.worksheets[0];
      expect(sheet?.name).toBe('Reporte de Ventas Diarias');

      // Check title
      expect(sheet?.getRow(1).getCell(1).value).toBe('Reporte de Ventas Diarias');

      // Check headers
      expect(sheet?.getRow(3).getCell(1).value).toBe('Fecha');
      expect(sheet?.getRow(3).getCell(2).value).toBe('Sucursal');
      expect(sheet?.getRow(3).getCell(3).value).toBe('Producto');

      // Check data row
      expect(sheet?.getRow(4).getCell(2).value).toBe('Sucursal Principal');
      expect(sheet?.getRow(4).getCell(3).value).toBe('Producto A');
      expect(sheet?.getRow(4).getCell(5).value).toBe(50);
      expect(sheet?.getRow(4).getCell(6).value).toBe(1500);
    });
  });

  describe('categorySalesTemplate', () => {
    it('creates a workbook with category sales data', () => {
      const data: CategorySalesReport[] = [
        {
          branchId: 'branch_1',
          branchName: 'Sucursal Principal',
          day: new Date('2024-01-15'),
          categoryId: 'cat_1',
          categoryName: 'Bebidas',
          grossTotal: 2500,
          grossProfit: 500,
          qtySold: 100,
        },
      ];

      const workbook = categorySalesTemplate(data);

      expect(workbook).toBeDefined();
      const sheet = workbook.worksheets[0];
      expect(sheet?.name).toBe('Ventas por Categoria');

      // Check data
      expect(sheet?.getRow(4).getCell(3).value).toBe('Bebidas');
      expect(sheet?.getRow(4).getCell(4).value).toBe(100);
      expect(sheet?.getRow(4).getCell(5).value).toBe(2500);
    });
  });

  describe('inventoryValuationTemplate', () => {
    it('creates a workbook with inventory data', () => {
      const data: InventoryValuationReport[] = [
        {
          branchId: 'branch_1',
          branchName: 'Sucursal Principal',
          productId: 'prod_1',
          productName: 'Producto A',
          qty: 100,
          avgCost: 15.5,
          valuation: 1550,
        },
      ];

      const workbook = inventoryValuationTemplate(data);

      expect(workbook).toBeDefined();
      const sheet = workbook.worksheets[0];
      expect(sheet?.name).toBe('Inventario Valorizado');

      // Check data
      expect(sheet?.getRow(4).getCell(1).value).toBe('Sucursal Principal');
      expect(sheet?.getRow(4).getCell(2).value).toBe('Producto A');
      expect(sheet?.getRow(4).getCell(3).value).toBe(100);
      expect(sheet?.getRow(4).getCell(4).value).toBe(15.5);
      expect(sheet?.getRow(4).getCell(5).value).toBe(1550);
    });
  });

  describe('cashReportTemplate', () => {
    it('creates a workbook with cash report data', () => {
      const data: CashSummaryReport[] = [
        {
          branchId: 'branch_1',
          branchName: 'Sucursal Principal',
          day: new Date('2024-01-15'),
          sessionCount: 3,
          totalOpening: 1500,
          totalExpected: 8500,
          totalCollected: 8450,
          totalDifference: -50,
        },
      ];

      const workbook = cashReportTemplate(data);

      expect(workbook).toBeDefined();
      const sheet = workbook.worksheets[0];
      expect(sheet?.name).toBe('Reporte de Caja');

      // Check data
      expect(sheet?.getRow(4).getCell(2).value).toBe('Sucursal Principal');
      expect(sheet?.getRow(4).getCell(3).value).toBe(3);
      expect(sheet?.getRow(4).getCell(4).value).toBe(1500);
      expect(sheet?.getRow(4).getCell(5).value).toBe(8500);
      expect(sheet?.getRow(4).getCell(6).value).toBe(8450);
      expect(sheet?.getRow(4).getCell(7).value).toBe(-50);
    });
  });

  describe('empty data', () => {
    it('handles empty data array', () => {
      const workbook = dailySalesTemplate([]);

      expect(workbook).toBeDefined();
      const sheet = workbook.worksheets[0];
      expect(sheet?.rowCount).toBe(3); // Title + header only
    });
  });
});
