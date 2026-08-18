'use client';

import { CartPanel } from '@/components/pos/cart-panel';
import { PaymentModal } from '@/components/pos/payment-modal';
import { type Product, ProductGrid } from '@/components/pos/product-grid';
import { ShortcutBar } from '@/components/pos/shortcut-bar';
import { useOpenSessionByBranch } from '@/hooks/queries/use-cash';
import { useProducts } from '@/hooks/queries/use-catalog';
import { useCategories } from '@/hooks/queries/use-categories';
import { useStockByBranch } from '@/hooks/queries/use-inventory';
import { useCartStore } from '@/hooks/use-cart';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function PosPage() {
  const branchCode = useCartStore((s) => s.branchCode);
  const setCashSession = useCartStore((s) => s.setCashSession);
  const cashierSessionId = useCartStore((s) => s.cashierSessionId);

  const { data: productsData, isLoading: productsLoading } = useProducts({
    status: 'ACTIVE',
    limit: 200,
  });
  const { data: categoriesData } = useCategories();
  const { data: openSession } = useOpenSessionByBranch(branchCode);
  const { data: stockData } = useStockByBranch(branchCode);

  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Link cash session if found
  useEffect(() => {
    if (openSession && !cashierSessionId) {
      setCashSession(openSession.id);
    }
  }, [openSession, cashierSessionId, setCashSession]);

  const products: Product[] = useMemo(() => {
    if (!productsData?.data) return [];

    const stockMap = new Map<string, number>();
    if (stockData) {
      for (const s of stockData) {
        stockMap.set(s.productId, s.available);
      }
    }

    return productsData.data.map((p) => {
      let imageUrl: string | undefined;
      if (Array.isArray(p.images) && p.images.length > 0) {
        const img = p.images[0] as { url?: string; publicId?: string };
        imageUrl = img?.url;
      }
      if (!imageUrl) {
        const pAny = p as unknown as Record<string, unknown>;
        if (typeof pAny.imageUrl === 'string') {
          imageUrl = pAny.imageUrl;
        }
      }

      const stock = stockMap.get(p.id) ?? p.stock;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        taxRate: p.taxRate || 0.18,
        imageUrl,
        category: p.categoryId,
        stock,
        isOutOfStock: p.trackStock && stock <= 0,
      };
    });
  }, [productsData, stockData]);

  const categories = useMemo(
    () => (categoriesData ?? []).map((c) => ({ id: c.id, name: c.name })),
    [categoriesData],
  );

  const handleCheckout = useCallback(() => setPaymentOpen(true), []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Product grid - takes remaining space */}
        <ProductGrid products={products} categories={categories} isLoading={productsLoading} />

        {/* Cart panel - sidebar on desktop, sheet on mobile */}
        <CartPanel open={cartOpen} onOpenChange={setCartOpen} onCheckout={handleCheckout} />
      </div>

      {/* Keyboard shortcuts bar */}
      <ShortcutBar />

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        branchCode={branchCode}
        cashierSessionId={cashierSessionId}
      />
    </div>
  );
}
