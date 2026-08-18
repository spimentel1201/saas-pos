'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdjustStock } from '@/hooks/queries/use-inventory';
import { Wrench } from 'lucide-react';
import { useState } from 'react';

interface AdjustStockDialogProps {
  branchCode: string;
  productId: string;
  currentQty: number;
  minQty: number;
  maxQty: number;
}

export function AdjustStockDialog({
  branchCode,
  productId,
  currentQty,
  minQty,
  maxQty,
}: AdjustStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'absolute' | 'relative'>('absolute');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const adjustStock = useAdjustStock();

  const handleSubmit = () => {
    const num = Number(value);
    if (Number.isNaN(num)) return;

    const data =
      mode === 'absolute'
        ? { newQty: Math.max(0, num), reason: reason || 'Ajuste manual' }
        : { delta: num, reason: reason || 'Ajuste manual' };

    adjustStock.mutate(
      { branchCode, productId, data },
      {
        onSuccess: () => {
          setOpen(false);
          setValue('');
          setReason('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Wrench className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
          <DialogDescription>
            Producto en sucursal {branchCode}. Stock actual: {currentQty}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'absolute' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('absolute')}
            >
              Cantidad absoluta
            </Button>
            <Button
              type="button"
              variant={mode === 'relative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('relative')}
            >
              Delta (+/-)
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-value">
              {mode === 'absolute' ? 'Nueva cantidad' : 'Delta (positivo o negativo)'}
            </Label>
            <Input
              id="adj-value"
              type="number"
              min={mode === 'absolute' ? 0 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === 'absolute' ? String(currentQty) : '+10 o -5'}
            />
            {mode === 'relative' && value && (
              <p className="text-xs text-muted-foreground">
                Stock resultante: {currentQty + Number(value)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-reason">Motivo</Label>
            <Input
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Conteo ciclico, merma, etc."
            />
          </div>

          {minQty > 0 && (
            <p className="text-xs text-muted-foreground">
              Minimo configurado: {minQty} | Maximo: {maxQty || '—'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!value || adjustStock.isPending}>
            {adjustStock.isPending ? 'Ajustando...' : 'Aplicar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
