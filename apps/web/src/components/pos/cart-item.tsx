'use client';

import { Button } from '@/components/ui/button';
import { type CartItem as CartItemType, useCartStore } from '@/hooks/use-cart';
import { formatPEN } from '@/lib/formatters';
import { Minus, Plus, X } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 py-2.5">
      {/* Avatar */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-9 w-9 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
          {item.name.charAt(0)}
        </div>
      )}

      {/* Name + unit price */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
        <p className="text-[11px] text-muted-foreground">{formatPEN(item.unitPrice)}</p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQty(item.productId, item.qty - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQty(item.productId, item.qty + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Line total + remove */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
          {formatPEN(item.unitPrice * item.qty)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground/50 hover:text-destructive"
          onClick={() => removeItem(item.productId)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
