'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  useCartItemCount,
  useCartStore,
  useCartSubtotal,
  useCartTax,
  useCartTotal,
} from '@/hooks/use-cart';
import { formatPEN } from '@/lib/formatters';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { CartItem } from './cart-item';
import { CustomerSelector } from './customer-selector';

interface CartPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: () => void;
}

function CartHeader() {
  const clearCart = useCartStore((s) => s.clearCart);
  const itemCount = useCartItemCount();
  const items = useCartStore((s) => s.items);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Carrito {itemCount > 0 && `(${itemCount})`}</span>
      </div>
      {items.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-destructive"
          onClick={clearCart}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Vaciar
        </Button>
      )}
    </div>
  );
}

function CartFooter({ onCheckout }: { onCheckout: () => void }) {
  const subtotal = useCartSubtotal();
  const tax = useCartTax();
  const total = useCartTotal();

  return (
    <div className="shrink-0 border-t bg-card px-4 py-3">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPEN(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">IGV (18%)</span>
          <span>{formatPEN(tax)}</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatPEN(total)}</span>
        </div>
      </div>

      <Button className="mt-3 h-12 w-full text-base font-semibold" onClick={onCheckout}>
        Pagar {formatPEN(total)}
      </Button>
    </div>
  );
}

function CartItems() {
  const items = useCartStore((s) => s.items);

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Carrito vacío</p>
        <p className="text-xs text-muted-foreground/70">Toca un producto para agregarlo</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      {items.map((item) => (
        <CartItem key={item.productId} item={item} />
      ))}
    </ScrollArea>
  );
}

export function CartPanel({ open, onOpenChange, onCheckout }: CartPanelProps) {
  const itemCount = useCartItemCount();

  return (
    <>
      {/* Desktop: fixed right sidebar — direct flex child */}
      <aside className="hidden w-80 shrink-0 flex-col border-l bg-card lg:flex xl:w-96">
        <CartHeader />
        <div className="px-4 pt-3">
          <CustomerSelector />
        </div>
        <Separator className="mt-3" />
        <CartItems />
        <CartFooter onCheckout={onCheckout} />
      </aside>

      {/* Mobile: floating action button */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
        onClick={() => onOpenChange(true)}
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* Mobile: bottom sheet — header + scrollable items + sticky footer */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex h-[85dvh] flex-col p-0 lg:hidden">
          <SheetHeader className="shrink-0 border-b px-4 py-3">
            <SheetTitle>Carrito</SheetTitle>
          </SheetHeader>
          <div className="shrink-0 px-4 pt-3">
            <CustomerSelector />
          </div>
          <Separator className="mt-3" />
          <CartItems />
          <CartFooter onCheckout={onCheckout} />
        </SheetContent>
      </Sheet>
    </>
  );
}
