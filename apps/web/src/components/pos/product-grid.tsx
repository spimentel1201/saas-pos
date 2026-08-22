'use client';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/hooks/use-cart';
import { formatPEN } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  taxRate: number;
  imageUrl?: string;
  category?: string;
  stock: number;
  isOutOfStock: boolean;
}

interface ProductGridProps {
  products: Product[];
  categories: { id: string; name: string }[];
  isLoading?: boolean;
  isOffline?: boolean;
}

export function ProductGrid({ products, categories, isLoading, isOffline }: ProductGridProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
    }
    if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory);
    }
    return list;
  }, [products, search, selectedCategory]);

  const handleAdd = (product: Product) => {
    if (product.isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      unitPrice: product.price,
      taxRate: product.taxRate,
      imageUrl: product.imageUrl,
    });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Search */}
      <div className="shrink-0 border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isOffline && (
          <p className="mt-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            Modo offline — usando datos en caché
          </p>
        )}
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b px-4 py-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
                selectedCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-muted p-2">
                <div className="mb-2 aspect-square rounded bg-muted-foreground/10" />
                <div className="h-3 w-3/4 rounded bg-muted-foreground/10" />
                <div className="mt-1 h-3 w-1/2 rounded bg-muted-foreground/10" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleAdd(product)}
                disabled={product.isOutOfStock}
                className={cn(
                  'group overflow-hidden rounded-lg border border-border bg-card text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.97]',
                  product.isOutOfStock && 'cursor-not-allowed opacity-50',
                )}
              >
                {/* Compact image area */}
                <div className="flex aspect-[4/3] items-center justify-center bg-muted/50 p-2">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full rounded object-contain"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground/20">
                      {product.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="truncate text-xs font-medium leading-tight">{product.name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">
                      {formatPEN(product.price)}
                    </span>
                    {product.isOutOfStock && (
                      <span className="text-[9px] font-medium text-destructive">Sin stock</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
