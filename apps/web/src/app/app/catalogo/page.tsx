'use client';

import { AdjustStockDialog } from '@/components/adjust-stock-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type Product,
  useDeleteProduct,
  useProducts,
  useUpdateProductStatus,
} from '@/hooks/queries/use-catalog';
import { useCategories } from '@/hooks/queries/use-categories';
import { type StockItem, useStockByBranch } from '@/hooks/queries/use-inventory';
import { useCartStore } from '@/hooks/use-cart';
import { formatPEN } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Package,
  Plus,
  Power,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useProducts({
    query: search || undefined,
    categoryId: categoryId || undefined,
    status: (status as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED') || undefined,
    page,
    limit,
  });

  const { data: categories } = useCategories();
  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateProductStatus();
  const branchCode = useCartStore((s) => s.branchCode);
  const { data: branchStock } = useStockByBranch(branchCode);

  const stockMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    for (const item of branchStock ?? []) {
      map.set(item.productId, item);
    }
    return map;
  }, [branchStock]);

  const products = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Eliminar "${name}"?`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Catalogo</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Gestiona tus productos y categorias
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/app/catalogo/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-semibold">Productos</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, SKU..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full pl-9 sm:w-64"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={categoryId}
                  onValueChange={(v: string) => {
                    setCategoryId(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-40">
                    <Filter className="mr-2 h-3 w-3" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories?.map((cat: { id: string; name: string }) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={status}
                  onValueChange={(v: string) => {
                    setStatus(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-36">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm text-muted-foreground">
                {search ? 'Intenta con otra busqueda' : 'Crea tu primer producto para comenzar'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: Card list */}
              <div className="flex flex-col gap-2 md:hidden">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    branchStock={stockMap.get(product.id)}
                    branchCode={branchCode}
                    onDelete={handleDelete}
                    onToggleStatus={(id, st) =>
                      updateStatus.mutate({
                        id,
                        status: st === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      })
                    }
                    isDeleting={deleteProduct.isPending}
                    isUpdatingStatus={updateStatus.isPending}
                  />
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 font-medium">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Producto
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </th>
                      <th className="hidden pb-3 font-medium lg:table-cell">SKU</th>
                      <th className="hidden pb-3 font-medium lg:table-cell">Categoria</th>
                      <th className="pb-3 text-right font-medium">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Precio
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </th>
                      <th className="hidden pb-3 text-right font-medium sm:table-cell">Stock</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        branchStock={stockMap.get(product.id)}
                        branchCode={branchCode}
                        onDelete={handleDelete}
                        onToggleStatus={(id, st) =>
                          updateStatus.mutate({
                            id,
                            status: st === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                          })
                        }
                        isDeleting={deleteProduct.isPending}
                        isUpdatingStatus={updateStatus.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {data?.total ?? 0} producto{(data?.total ?? 0) !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Activo',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  INACTIVE: { label: 'Inactivo', className: 'bg-muted text-muted-foreground' },
  DISCONTINUED: {
    label: 'Descontinuado',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  DRAFT: { label: 'Borrador', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
} as const;

function ProductCard({
  product,
  branchStock,
  branchCode,
  onDelete,
  onToggleStatus,
  isDeleting,
  isUpdatingStatus,
}: {
  product: Product;
  branchStock?: StockItem;
  branchCode: string;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
}) {
  const status =
    STATUS_CONFIG[product.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;

  return (
    <div className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
          {product.images?.[0] ? (
            <img
              src={product.images[0] as unknown as string}
              alt={product.name}
              className="h-11 w-11 rounded-lg object-cover"
            />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                {product.sku && <span className="font-mono">{product.sku}</span>}
                {product.barcode && (
                  <>
                    <span className="text-border">|</span>
                    <span className="font-mono">{product.barcode}</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className={cn('shrink-0 text-[10px]', status.className)}>
              {status.label}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-base font-semibold">{formatPEN(product.price)}</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {product.trackStock ? (
                <span
                  className={cn(
                    'font-medium',
                    product.isLowStock && 'text-amber-500',
                    product.isOutOfStock && 'text-red-500',
                  )}
                >
                  {product.stock} uds.
                  {product.isLowStock && <AlertTriangle className="ml-0.5 inline h-3 w-3" />}
                </span>
              ) : (
                <span>Sin stock</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 border-t pt-2">
        {product.trackStock && branchStock && (
          <AdjustStockDialog
            branchCode={branchCode}
            productId={product.id}
            currentQty={branchStock.qty}
            minQty={branchStock.minQty}
            maxQty={branchStock.maxQty}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onToggleStatus(product.id, product.status)}
          disabled={isUpdatingStatus}
        >
          <Power
            className={cn(
              'mr-1 h-3.5 w-3.5',
              product.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground',
            )}
          />
          {product.status === 'ACTIVE' ? 'Off' : 'On'}
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
          <Link href={`/app/catalogo/${product.id}`}>
            <Edit className="mr-1 h-3.5 w-3.5" />
            Editar
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-destructive"
          onClick={() => onDelete(product.id, product.name)}
          disabled={isDeleting}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Elim.
        </Button>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  branchStock,
  branchCode,
  onDelete,
  onToggleStatus,
  isDeleting,
  isUpdatingStatus,
}: {
  product: Product;
  branchStock?: StockItem;
  branchCode: string;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
}) {
  const status =
    STATUS_CONFIG[product.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {product.images?.[0] ? (
              <img
                src={product.images[0] as unknown as string}
                alt={product.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            {product.barcode && <p className="text-xs text-muted-foreground">{product.barcode}</p>}
          </div>
        </div>
      </td>
      <td className="hidden py-3 font-mono text-sm lg:table-cell">{product.sku}</td>
      <td className="hidden py-3 text-sm lg:table-cell">
        {product.categoryId ? (
          <Badge variant="outline" className="font-normal">
            {product.categoryId}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-3 text-right font-mono text-sm">{formatPEN(product.price)}</td>
      <td className="hidden py-3 text-right text-sm sm:table-cell">
        {product.trackStock ? (
          <span
            className={cn(
              'font-medium',
              product.isLowStock && 'text-amber-400',
              product.isOutOfStock && 'text-red-400',
            )}
          >
            {product.stock}
            {product.isLowStock && <AlertTriangle className="ml-1 inline h-3 w-3" />}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-3">
        <Badge variant="outline" className={cn('font-normal', status.className)}>
          {status.label}
        </Badge>
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {product.trackStock && branchStock && (
            <AdjustStockDialog
              branchCode={branchCode}
              productId={product.id}
              currentQty={branchStock.qty}
              minQty={branchStock.minQty}
              maxQty={branchStock.maxQty}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleStatus(product.id, product.status)}
            disabled={isUpdatingStatus}
            title={product.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
          >
            <Power
              className={cn(
                'h-4 w-4',
                product.status === 'ACTIVE' ? 'text-green-600' : 'text-muted-foreground',
              )}
            />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/app/catalogo/${product.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(product.id, product.name)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
