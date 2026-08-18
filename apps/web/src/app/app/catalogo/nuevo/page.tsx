'use client';

import { ImageUpload } from '@/components/image-upload';
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
import { useCreateProduct } from '@/hooks/queries/use-catalog';
import { useCategories } from '@/hooks/queries/use-categories';
import { useAuthStore } from '@/lib/store';
import { ApiError } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();
  const tenantSlug = useAuthStore((s) => s.tenantSlug);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    price: '',
    cost: '',
    taxRate: '0.18',
    type: 'GOOD' as const,
    trackStock: true,
    initialStock: '',
    minStock: '',
    maxStock: '',
  });

  const [image, setImage] = useState<{ url: string; publicId: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!form.sku.trim()) newErrors.sku = 'El SKU es requerido';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'El precio debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      type: form.type,
      trackStock: form.trackStock,
    };

    if (form.barcode) payload.barcode = form.barcode;
    if (form.description) payload.description = form.description;
    if (form.categoryId) payload.categoryId = form.categoryId;
    if (form.cost) payload.cost = Number(form.cost);
    if (form.taxRate) payload.taxRate = Number(form.taxRate);
    if (form.trackStock && form.initialStock) payload.initialStock = Number(form.initialStock);
    if (form.trackStock && form.minStock) payload.minStock = Number(form.minStock);
    if (form.trackStock && form.maxStock) payload.maxStock = Number(form.maxStock);
    if (image) {
      payload.imageUrl = image.url;
      payload.imagePublicId = image.publicId;
    }

    createProduct.mutate(payload, {
      onSuccess: () => {
        router.push('/app/catalogo');
      },
      onError: (error: ApiError) => {
        setErrors({ submit: error.detail });
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/catalogo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Producto</h1>
          <p className="text-sm text-muted-foreground">Agrega un producto al catalogo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacion Basica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Coca-Cola 500ml"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="CC-500"
                    className="font-mono"
                  />
                  {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Codigo de barras</Label>
                  <Input
                    id="barcode"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="7791234567890"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripcion del producto"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Precios e Impuestos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio de venta (S/.) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo (S/.)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Impuesto</Label>
                <Select
                  value={form.taxRate}
                  onValueChange={(v: string) => setForm({ ...form, taxRate: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Exonerado (0%)</SelectItem>
                    <SelectItem value="0.18">IGV (18%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full space-y-6 lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clasificacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: string) => setForm({ ...form, type: v as typeof form.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOOD">Producto</SelectItem>
                    <SelectItem value="SERVICE">Servicio</SelectItem>
                    <SelectItem value="BUNDLE">Paquete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v: string) =>
                    setForm({ ...form, categoryId: v === 'none' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoria</SelectItem>
                    {categories?.map((cat: { id: string; name: string }) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="trackStock">Controlar stock</Label>
                <input
                  id="trackStock"
                  type="checkbox"
                  checked={form.trackStock}
                  onChange={(e) => setForm({ ...form, trackStock: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
              </div>

              {form.trackStock && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="initialStock">Stock inicial</Label>
                    <Input
                      id="initialStock"
                      type="number"
                      min="0"
                      value={form.initialStock}
                      onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Minimo</Label>
                      <Input
                        id="minStock"
                        type="number"
                        min="0"
                        value={form.minStock}
                        onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStock">Maximo</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        min="0"
                        value={form.maxStock}
                        onChange={(e) => setForm({ ...form, maxStock: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Imagen</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={image}
                onChange={setImage}
                folder={`tenants/${tenantSlug ?? 'default'}/products`}
              />
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {errors.submit}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={createProduct.isPending}>
            {createProduct.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Producto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
