'use client';

import { AdjustStockDialog } from '@/components/adjust-stock-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/queries/use-catalog';
import { type StockItem, useLowStock, useStockByBranch } from '@/hooks/queries/use-inventory';
import { formatPEN } from '@/lib/formatters';
import {
  AlertTriangle,
  ArrowUpDown,
  Box,
  LayoutGrid,
  List,
  Package,
  Search,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const BRANCHES = [
  { code: 'CEN01', name: 'Lima Centro', city: 'Lima' },
  { code: 'NOR01', name: 'Norte', city: 'Trujillo' },
  { code: 'SUR01', name: 'Sur', city: 'Arequipa' },
];

function StockCard({ item, productName }: { item: StockItem; productName: string }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{productName}</p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {item.productId}
            </p>
          </div>
          <div className="ml-2 shrink-0">
            {item.isLow ? (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs"
              >
                Bajo
              </Badge>
            ) : item.isOverMax ? (
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs"
              >
                Exceso
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs"
              >
                OK
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-muted px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Stock</p>
            <p className="text-sm font-bold">{item.qty}</p>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Disp.</p>
            <p className="text-sm font-bold">{item.available}</p>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase text-muted-foreground">Valor</p>
            <p className="text-xs font-bold">{formatPEN(item.qty * item.avgCost)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Min: {item.minQty} | Max: {item.maxQty || '—'}
          </p>
          <AdjustStockDialog
            branchCode={item.branchCode}
            productId={item.productId}
            currentQty={item.qty}
            minQty={item.minQty}
            maxQty={item.maxQty}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InventarioPage() {
  const [branch, setBranch] = useState('CEN01');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    if (mq.matches) setView('cards');
    const handler = (e: MediaQueryListEvent) => setView(e.matches ? 'cards' : 'table');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { data: stock, isLoading } = useStockByBranch(branch);
  const { data: lowStock } = useLowStock(branch);
  const { data: products } = useProducts({ limit: 200 });

  const productNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (products?.data) {
      for (const p of products.data) {
        map[p.id] = p.name;
      }
    }
    return map;
  }, [products]);

  const getName = (productId: string) => productNameMap[productId] ?? productId;

  const filtered = stock?.filter(
    (s) =>
      getName(s.productId).toLowerCase().includes(search.toLowerCase()) ||
      s.productId.toLowerCase().includes(search.toLowerCase()),
  );

  const totalProducts = stock?.length ?? 0;
  const totalUnits = stock?.reduce((sum, s) => sum + s.qty, 0) ?? 0;
  const totalValue = stock?.reduce((sum, s) => sum + s.qty * s.avgCost, 0) ?? 0;
  const lowCount = lowStock?.length ?? 0;

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground">Stock por sucursal, movimientos y ajustes</p>
        </div>
        <Link href="/app/inventario/transferencias">
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Transferencias
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Productos</p>
                <p className="text-lg font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
                <Box className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unidades</p>
                <p className="text-lg font-bold">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Wrench className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valorizado</p>
                <p className="text-lg font-bold">{formatPEN(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock Bajo</p>
                <p className="text-lg font-bold text-amber-400">{lowCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch tabs + search + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={branch} onValueChange={setBranch}>
          <TabsList>
            {BRANCHES.map((b) => (
              <TabsTrigger key={b.code} value={b.code} className="text-xs sm:text-sm">
                {b.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-muted pl-10 text-sm"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => setView('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'cards' ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => setView('cards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !filtered?.length ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Package className="h-8 w-8" />
          <p className="text-sm">No hay productos en esta sucursal</p>
        </div>
      ) : view === 'cards' ? (
        /* Card view (mobile default) */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <StockCard key={item.id} item={item} productName={getName(item.productId)} />
          ))}
        </div>
      ) : (
        /* Table view (desktop default) */
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Stock — {BRANCHES.find((b) => b.code === branch)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 text-right font-medium">Stock</th>
                    <th className="pb-2 text-right font-medium">Disponible</th>
                    <th className="pb-2 text-right font-medium">Min</th>
                    <th className="pb-2 text-right font-medium">Max</th>
                    <th className="pb-2 text-right font-medium">Costo U.</th>
                    <th className="pb-2 text-right font-medium">Valor</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-border/50">
                      <td className="py-2.5">
                        <p className="text-sm font-medium">{getName(item.productId)}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.productId}</p>
                      </td>
                      <td className="py-2.5 text-right font-mono text-sm font-medium">
                        {item.qty}
                      </td>
                      <td className="py-2.5 text-right font-mono text-sm">{item.available}</td>
                      <td className="py-2.5 text-right font-mono text-xs text-muted-foreground">
                        {item.minQty}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs text-muted-foreground">
                        {item.maxQty || '—'}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">
                        {formatPEN(item.avgCost)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">
                        {formatPEN(item.qty * item.avgCost)}
                      </td>
                      <td className="py-2.5">
                        {item.isLow ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs"
                          >
                            Bajo
                          </Badge>
                        ) : item.isOverMax ? (
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs"
                          >
                            Exceso
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs"
                          >
                            OK
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5">
                        <AdjustStockDialog
                          branchCode={item.branchCode}
                          productId={item.productId}
                          currentQty={item.qty}
                          minQty={item.minQty}
                          maxQty={item.maxQty}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
