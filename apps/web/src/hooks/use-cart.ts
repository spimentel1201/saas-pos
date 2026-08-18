'use client';

import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  unitPrice: number;
  taxRate: number;
  qty: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  branchCode: string;
  cashierSessionId?: number;
  customerId?: string;

  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setBranch: (code: string) => void;
  setCashSession: (id: number) => void;
  setCustomer: (id: string | undefined) => void;
}

function loadBranch(): string {
  if (typeof window === 'undefined') return 'CEN01';
  return localStorage.getItem('pos:branchCode') || 'CEN01';
}

function loadItems(branchCode: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`pos:cart:${branchCode}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(branchCode: string, items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`pos:cart:${branchCode}`, JSON.stringify(items));
}

export const useCartStore = create<CartState>((set, get) => {
  const branchCode = loadBranch();
  const items = loadItems(branchCode);

  return {
    items,
    branchCode,
    cashierSessionId: undefined,
    customerId: undefined,

    addItem: (item, qty = 1) => {
      const { items, branchCode } = get();
      const existing = items.find((i) => i.productId === item.productId);
      let next: CartItem[];
      if (existing) {
        next = items.map((i) =>
          i.productId === item.productId ? { ...i, qty: i.qty + qty } : i,
        );
      } else {
        next = [...items, { ...item, qty }];
      }
      saveItems(branchCode, next);
      set({ items: next });
    },

    removeItem: (productId) => {
      const { items, branchCode } = get();
      const next = items.filter((i) => i.productId !== productId);
      saveItems(branchCode, next);
      set({ items: next });
    },

    updateQty: (productId, qty) => {
      const { items, branchCode } = get();
      if (qty <= 0) {
        const next = items.filter((i) => i.productId !== productId);
        saveItems(branchCode, next);
        set({ items: next });
        return;
      }
      const next = items.map((i) => (i.productId === productId ? { ...i, qty } : i));
      saveItems(branchCode, next);
      set({ items: next });
    },

    clearCart: () => {
      const { branchCode } = get();
      saveItems(branchCode, []);
      set({ items: [] });
    },

    setBranch: (code) => {
      const items = loadItems(code);
      localStorage.setItem('pos:branchCode', code);
      set({ branchCode: code, items });
    },

    setCashSession: (id) => set({ cashierSessionId: id }),
    setCustomer: (id) => set({ customerId: id }),
  };
});

// ---- Selectors (reactive) ----

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

function calcTax(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty * item.taxRate, 0);
}

export function useCartSubtotal() {
  return useCartStore((s) => calcSubtotal(s.items));
}

export function useCartTax() {
  return useCartStore((s) => calcTax(s.items));
}

export function useCartTotal() {
  return useCartStore((s) => calcSubtotal(s.items) + calcTax(s.items));
}

export function useCartItemCount() {
  return useCartStore((s) => s.items.reduce((sum, item) => sum + item.qty, 0));
}
