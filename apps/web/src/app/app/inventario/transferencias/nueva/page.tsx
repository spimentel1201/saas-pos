'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTransfer } from '@/hooks/queries/use-inventory';
import { useProducts } from '@/hooks/queries/use-catalog';
import { ApiError } from '@/lib/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const BRANCHES = [
  { code: 'CEN01', name: 'Lima Centro' },
  { code: 'NOR01', name: 'Norte (Trujillo)' },
  { code: 'SUR01', name: 'Sur (Arequipa)' },
];

interface TransferItemForm {
  productId: string;
  qty: string;
}

export default function NewTransferPage() {
  const router = useRouter();
  const createTransfer = useCreateTransfer();
  const { data: products } = useProducts({ limit: 200 });

  const [fromBranch, setFromBranch] = useState('');
  const [toBranch, setToBranch] = useState('');
  const [items, setItems] = useState<TransferItemForm[]>([{ productId: '', qty: '' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addItem = () => {
    setItems([...items, { productId: '', qty: '1' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof TransferItemForm, value: string) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      return { productId: field === 'productId' ? value : item.productId, qty: field === 'qty' ? value : item.qty };
    });
    setItems(updated);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fromBranch) newErrors.fromBranch = 'Sucursal origen requerida';
    if (!toBranch) newErrors.toBranch = 'Sucursal destino requerida';
    if (fromBranch && toBranch && fromBranch === toBranch) {
      newErrors.toBranch = 'Origen y destino no pueden ser iguales';
    }
    const validItems = items.filter((i) => i.productId && i.qty);
    if (validItems.length === 0) newErrors.items = 'Agrega al menos un producto';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validItems = items
      .filter((i) => i.productId && i.qty)
      .map((i) => ({ productId: i.productId, qty: Number(i.qty) }));

    createTransfer.mutate(
      { fromBranch, toBranch, items: validItems },
      {
        onSuccess: (data) => {
          router.push(`/app/inventario/transferencias/${data.id}`);
        },
        onError: (error: ApiError) => {
          setErrors({ submit: error.detail });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/inventario/transferencias">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Transferencia</h1>
          <p className="text-sm text-muted-foreground">Mover stock entre sucursales</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sucursales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Origen *</Label>
                  <Select value={fromBranch} onValueChange={setFromBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map((b) => (
                        <SelectItem key={b.code} value={b.code}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.fromBranch && (
                    <p className="text-xs text-destructive">{errors.fromBranch}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Destino *</Label>
                  <Select value={toBranch} onValueChange={setToBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.filter((b) => b.code !== fromBranch).map((b) => (
                        <SelectItem key={b.code} value={b.code}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.toBranch && (
                    <p className="text-xs text-destructive">{errors.toBranch}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Productos</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-1 h-4 w-4" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    {index === 0 && <Label className="text-xs">Producto</Label>}
                    <Select
                      value={item.productId}
                      onValueChange={(v) => updateItem(index, 'productId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.data?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    {index === 0 && <Label className="text-xs">Cantidad</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="w-full space-y-4 lg:w-80">
          {errors.submit && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {errors.submit}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={createTransfer.isPending}>
            {createTransfer.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              'Crear Transferencia'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            La transferencia se crea en estado Pendiente. Despues podras enviarla y recibirla.
          </p>
        </div>
      </form>
    </div>
  );
}
