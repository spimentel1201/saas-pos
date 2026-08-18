'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type ReportFilter,
  downloadReport,
  useCashReport,
  useDailySales,
  useInventoryValuation,
  useSalesByCategory,
  useSalesByProduct,
} from '@/hooks/queries/use-reports';
import { formatPEN } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { BarChart3, Download, FileText, Package, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';

function DateFilter({
  onChange,
  exportType,
}: {
  onChange: (filter: ReportFilter) => void;
  exportType?: string;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const apply = () => {
    onChange({ from: from || undefined, to: to || undefined });
  };

  const handleExport = () => {
    if (exportType) {
      downloadReport(exportType, {
        from: from || undefined,
        to: to || undefined,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Label className="mb-1 block text-[10px] text-muted-foreground">Desde</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 w-full text-xs"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Label className="mb-1 block text-[10px] text-muted-foreground">Hasta</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 w-full text-xs"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={apply} className="flex-1">
          Aplicar
        </Button>
        {exportType && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1 h-3 w-3" />
            Excel
          </Button>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Package;
  color?: string;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className={cn('h-4 w-4', color ?? 'text-muted-foreground')} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DailySalesTab() {
  const [filter, setFilter] = useState<ReportFilter>({});
  const { data, isLoading } = useDailySales(filter);

  const grouped = (data ?? []).reduce(
    (acc, row) => {
      const key = row.productName;
      if (!acc[key]) {
        acc[key] = { productName: row.productName, qtySold: 0, grossTotal: 0, grossProfit: 0 };
      }
      acc[key].qtySold += row.qtySold;
      acc[key].grossTotal += row.grossTotal;
      acc[key].grossProfit += row.grossProfit;
      return acc;
    },
    {} as Record<
      string,
      { productName: string; qtySold: number; grossTotal: number; grossProfit: number }
    >,
  );

  const rows = Object.values(grouped).sort((a, b) => b.grossTotal - a.grossTotal);
  const totalSales = rows.reduce((s, r) => s + r.grossTotal, 0);
  const totalProfit = rows.reduce((s, r) => s + r.grossProfit, 0);
  const totalQty = rows.reduce((s, r) => s + r.qtySold, 0);

  return (
    <div className="space-y-3">
      <DateFilter onChange={setFilter} exportType="daily-sales" />

      {isLoading ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={BarChart3} message="Sin datos de ventas en el periodo seleccionado" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <KpiCard label="Ventas totales" value={formatPEN(totalSales)} icon={TrendingUp} />
            <KpiCard
              label="Utilidad"
              value={formatPEN(totalProfit)}
              icon={BarChart3}
              color="text-emerald-500"
            />
            <KpiCard label="Unidades" value={totalQty.toString()} icon={Package} />
          </div>

          {/* Mobile: Card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((row) => (
              <div key={row.productName} className="rounded-lg border bg-card p-3">
                <p className="truncate text-sm font-medium">{row.productName}</p>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row.qtySold} uds.</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{formatPEN(row.grossTotal)}</span>
                    <span className="font-mono text-emerald-500">{formatPEN(row.grossProfit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden bg-card md:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 text-right font-medium">Unidades</th>
                    <th className="px-4 py-3 text-right font-medium">Total Ventas</th>
                    <th className="px-4 py-3 text-right font-medium">Utilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.productName} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm font-medium">{row.productName}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.qtySold}</td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {formatPEN(row.grossTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-emerald-500">
                        {formatPEN(row.grossProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CategoryTab() {
  const [filter, setFilter] = useState<ReportFilter>({});
  const { data, isLoading } = useSalesByCategory(filter);

  const grouped = (data ?? []).reduce(
    (acc, row) => {
      const key = row.categoryName;
      if (!acc[key]) {
        acc[key] = { categoryName: row.categoryName, qtySold: 0, grossTotal: 0, grossProfit: 0 };
      }
      acc[key].qtySold += row.qtySold;
      acc[key].grossTotal += row.grossTotal;
      acc[key].grossProfit += row.grossProfit;
      return acc;
    },
    {} as Record<
      string,
      { categoryName: string; qtySold: number; grossTotal: number; grossProfit: number }
    >,
  );

  const rows = Object.values(grouped).sort((a, b) => b.grossTotal - a.grossTotal);
  const totalSales = rows.reduce((s, r) => s + r.grossTotal, 0);

  return (
    <div className="space-y-3">
      <DateFilter onChange={setFilter} exportType="by-category" />

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={BarChart3} message="Sin datos de ventas por categoria" />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const pct = totalSales > 0 ? (row.grossTotal / totalSales) * 100 : 0;
            return (
              <Card key={row.categoryName} className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.categoryName}</p>
                      <p className="text-xs text-muted-foreground">{row.qtySold} unidades</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-mono font-semibold">{formatPEN(row.grossTotal)}</p>
                      <p className="text-xs font-mono text-emerald-500">
                        {formatPEN(row.grossProfit)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">
                    {pct.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopProductsTab() {
  const [filter, setFilter] = useState<ReportFilter>({});
  const { data, isLoading } = useSalesByProduct(filter);

  const rows = (data ?? []).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 20);

  return (
    <div className="space-y-3">
      <DateFilter onChange={setFilter} />

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Package} message="Sin datos de ventas por producto" />
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((row, i) => (
              <div
                key={row.productId}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.productName}</p>
                  <p className="text-xs text-muted-foreground">{row.totalSold} uds.</p>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold">
                  {formatPEN(row.totalRevenue)}
                </span>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden bg-card md:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 text-right font-medium">Unidades</th>
                    <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.productId} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{row.productName}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.totalSold}</td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {formatPEN(row.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InventoryTab() {
  const { data, isLoading } = useInventoryValuation();

  const rows = (data ?? []).sort((a, b) => b.valuation - a.valuation);
  const totalValuation = rows.reduce((s, r) => s + r.valuation, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {rows.length} productos ·{' '}
          <span className="font-semibold text-foreground">{formatPEN(totalValuation)}</span>
        </p>
        <Button variant="outline" size="sm" onClick={() => downloadReport('inventory', {})}>
          <Download className="mr-1 h-3 w-3" />
          Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Package} message="Sin datos de inventario" />
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((row) => (
              <div
                key={`${row.productId}-${row.branchId}`}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.productName}</p>
                    <p className="text-xs text-muted-foreground">{row.branchName}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold">
                    {formatPEN(row.valuation)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Stock: {row.qty}</span>
                  <span className="font-mono">Costo: {formatPEN(row.avgCost)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden bg-card md:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Sucursal</th>
                    <th className="px-4 py-3 text-right font-medium">Stock</th>
                    <th className="px-4 py-3 text-right font-medium">Costo Unit.</th>
                    <th className="px-4 py-3 text-right font-medium">Valoracion</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.productId}-${row.branchId}`} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm font-medium">{row.productName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{row.branchName}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.qty}</td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {formatPEN(row.avgCost)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono font-semibold">
                        {formatPEN(row.valuation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CashTab() {
  const [filter, setFilter] = useState<ReportFilter>({});
  const { data, isLoading } = useCashReport(filter);

  const rows = data ?? [];
  const totals = rows.reduce(
    (acc, r) => ({
      opening: acc.opening + r.totalOpening,
      expected: acc.expected + r.totalExpected,
      collected: acc.collected + r.totalCollected,
      difference: acc.difference + r.totalDifference,
    }),
    { opening: 0, expected: 0, collected: 0, difference: 0 },
  );

  return (
    <div className="space-y-3">
      <DateFilter onChange={setFilter} exportType="cash" />

      {isLoading ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} message="Sin datos de caja en el periodo" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KpiCard label="Apertura" value={formatPEN(totals.opening)} icon={Wallet} />
            <KpiCard label="Esperado" value={formatPEN(totals.expected)} icon={BarChart3} />
            <KpiCard
              label="Recaudado"
              value={formatPEN(totals.collected)}
              icon={TrendingUp}
              color="text-emerald-500"
            />
            <KpiCard
              label="Diferencia"
              value={formatPEN(totals.difference)}
              icon={FileText}
              color={Math.abs(totals.difference) < 0.01 ? 'text-emerald-500' : 'text-amber-500'}
            />
          </div>

          {/* Mobile: Card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map((row, i) => (
              <div
                key={`${row.day}-${row.branchId}-${i}`}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{row.branchName}</p>
                    <p className="text-xs text-muted-foreground">{row.day}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      Math.abs(row.totalDifference) < 0.01
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }
                  >
                    {formatPEN(row.totalDifference)}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{row.sessionCount} sesiones</span>
                  <div className="flex gap-3">
                    <span>
                      Apertura: <span className="font-mono">{formatPEN(row.totalOpening)}</span>
                    </span>
                    <span>
                      Recaudado: <span className="font-mono">{formatPEN(row.totalCollected)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden bg-card md:block">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Dia</th>
                    <th className="px-4 py-3 font-medium">Sucursal</th>
                    <th className="px-4 py-3 text-right font-medium">Sesiones</th>
                    <th className="px-4 py-3 text-right font-medium">Apertura</th>
                    <th className="px-4 py-3 text-right font-medium">Esperado</th>
                    <th className="px-4 py-3 text-right font-medium">Recaudado</th>
                    <th className="px-4 py-3 text-right font-medium">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={`${row.day}-${row.branchId}-${i}`} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm">{row.day}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{row.branchName}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.sessionCount}</td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {formatPEN(row.totalOpening)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {formatPEN(row.totalExpected)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        {formatPEN(row.totalCollected)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono">
                        <Badge
                          variant="outline"
                          className={
                            Math.abs(row.totalDifference) < 0.01
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          }
                        >
                          {formatPEN(row.totalDifference)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Package; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Reportes</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Analisis de ventas, inventario y caja
        </p>
      </div>

      <Tabs defaultValue="sales">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="sales" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3" />
              Ventas
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3 w-3" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm">
              <Package className="h-3 w-3" />
              Top Productos
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5 text-xs sm:text-sm">
              <Package className="h-3 w-3" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="cash" className="gap-1.5 text-xs sm:text-sm">
              <Wallet className="h-3 w-3" />
              Caja
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sales" className="mt-4">
          <DailySalesTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoryTab />
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <TopProductsTab />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <InventoryTab />
        </TabsContent>
        <TabsContent value="cash" className="mt-4">
          <CashTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
