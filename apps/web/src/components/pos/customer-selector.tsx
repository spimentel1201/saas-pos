'use client';

import { type Customer, useCustomerSearch } from '@/hooks/queries/use-customers';
import { useCartStore } from '@/hooks/use-cart';
import { User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export function CustomerSelector() {
  const setCustomer = useCartStore((s) => s.setCustomer);
  const customerId = useCartStore((s) => s.customerId);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [] } = useCustomerSearch(query);

  useEffect(() => {
    if (!customerId) {
      setSelected(null);
    }
  }, [customerId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (customer: Customer) => {
      setSelected(customer);
      setCustomer(customer.id);
      setQuery('');
      setIsOpen(false);
    },
    [setCustomer],
  );

  const handleClear = useCallback(() => {
    setSelected(null);
    setCustomer(undefined);
    setQuery('');
  }, [setCustomer]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{selected.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {selected.documentType && selected.documentNumber
              ? `${selected.documentType}: ${selected.documentNumber}`
              : selected.phone || 'Sin documento'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar cliente (DNI, nombre, teléfono)..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query.length >= 2) setIsOpen(true);
        }}
        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {isOpen && query.length >= 2 && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSelect(customer)}
            >
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{customer.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {customer.documentType && customer.documentNumber
                    ? `${customer.documentType}: ${customer.documentNumber}`
                    : customer.phone || ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
