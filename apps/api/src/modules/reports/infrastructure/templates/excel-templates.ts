import type {
  CashSummaryReport,
  CategorySalesReport,
  DailySalesReport,
  InventoryValuationReport,
} from '../../domain/entities/report.entities.js';

function createWorkbook(title: string): {
  workbook: import('exceljs').Workbook;
  sheet: import('exceljs').Worksheet;
} {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExcelJS = require('exceljs') as typeof import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);

  sheet.getRow(1).getCell(1).value = title;
  sheet.getRow(1).getCell(1).font = { bold: true, size: 14, color: { argb: 'FF3B82F6' } };
  sheet.getRow(1).getCell(1).alignment = { horizontal: 'center' };
  sheet.mergeCells('A1:H1');

  return { workbook, sheet };
}

function setHeaders(sheet: import('exceljs').Worksheet, headers: string[]): void {
  sheet.getRow(3).values = headers;
  sheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
}

function setColumnWidths(sheet: import('exceljs').Worksheet, width: number): void {
  for (const col of sheet.columns) {
    col.width = width;
  }
}

export function dailySalesTemplate(data: DailySalesReport[]): import('exceljs').Workbook {
  const { workbook, sheet } = createWorkbook('Reporte de Ventas Diarias');

  setHeaders(sheet, [
    'Fecha',
    'Sucursal',
    'Producto',
    'Categoria',
    'Unidades',
    'Total Ventas',
    'Utilidad',
    'Cajero',
  ]);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row) {
      sheet.getRow(4 + i).values = [
        row.day,
        row.branchName,
        row.productName,
        row.categoryName,
        row.qtySold,
        row.grossTotal,
        row.grossProfit,
        row.userId,
      ];
    }
  }

  setColumnWidths(sheet, 18);
  return workbook;
}

export function categorySalesTemplate(data: CategorySalesReport[]): import('exceljs').Workbook {
  const { workbook, sheet } = createWorkbook('Ventas por Categoria');

  setHeaders(sheet, ['Fecha', 'Sucursal', 'Categoria', 'Unidades', 'Total Ventas', 'Utilidad']);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row) {
      sheet.getRow(4 + i).values = [
        row.day,
        row.branchName,
        row.categoryName,
        row.qtySold,
        row.grossTotal,
        row.grossProfit,
      ];
    }
  }

  setColumnWidths(sheet, 18);
  return workbook;
}

export function inventoryValuationTemplate(
  data: InventoryValuationReport[],
): import('exceljs').Workbook {
  const { workbook, sheet } = createWorkbook('Inventario Valorizado');

  setHeaders(sheet, ['Sucursal', 'Producto', 'Cantidad', 'Costo Promedio', 'Valorizacion']);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row) {
      sheet.getRow(4 + i).values = [
        row.branchName,
        row.productName,
        row.qty,
        row.avgCost,
        row.valuation,
      ];
    }
  }

  setColumnWidths(sheet, 18);
  return workbook;
}

export function cashReportTemplate(data: CashSummaryReport[]): import('exceljs').Workbook {
  const { workbook, sheet } = createWorkbook('Reporte de Caja');

  setHeaders(sheet, [
    'Fecha',
    'Sucursal',
    'Sesiones',
    'Apertura Total',
    'Esperado',
    'Contado',
    'Diferencia',
  ]);

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row) {
      sheet.getRow(4 + i).values = [
        row.day,
        row.branchName,
        row.sessionCount,
        row.totalOpening,
        row.totalExpected,
        row.totalCollected,
        row.totalDifference,
      ];
    }
  }

  setColumnWidths(sheet, 18);
  return workbook;
}
