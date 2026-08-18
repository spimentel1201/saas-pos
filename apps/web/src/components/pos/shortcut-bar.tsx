'use client';

import { Keyboard } from 'lucide-react';

const shortcuts = [
  { key: 'F1', action: 'Buscar' },
  { key: 'F2', action: 'Categoría' },
  { key: 'F3', action: 'Descuento' },
  { key: 'F4', action: 'Cliente' },
  { key: 'F5', action: 'Cobrar' },
  { key: 'F6', action: 'Hold' },
  { key: 'F7', action: 'Recall' },
];

interface ShortcutBarProps {
  className?: string;
}

export function ShortcutBar({ className }: ShortcutBarProps) {
  return (
    <div
      className={`flex items-center gap-1 overflow-x-auto border-t bg-muted/50 px-2 py-1.5 ${className ?? ''}`}
    >
      <Keyboard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {shortcuts.map((s) => (
        <div key={s.key} className="flex items-center gap-1 shrink-0">
          <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border bg-background px-1 text-[10px] font-medium text-muted-foreground">
            {s.key}
          </kbd>
          <span className="text-[10px] text-muted-foreground">{s.action}</span>
        </div>
      ))}
    </div>
  );
}
