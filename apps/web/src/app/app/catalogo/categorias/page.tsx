'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/queries/use-categories';
import { ApiError } from '@/lib/api';
import { ArrowLeft, Edit, Folder, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpen = (id?: string) => {
    if (id) {
      const cat = categories?.find((c) => c.id === id);
      if (cat) {
        setEditingId(id);
        setName(cat.name);
        setDescription(cat.description || '');
      }
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrors({ name: 'El nombre es requerido' });
      return;
    }

    if (editingId) {
      updateCategory.mutate(
        { id: editingId, data: { name, description: description || undefined } },
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (error: ApiError) => setErrors({ submit: error.detail }),
        },
      );
    } else {
      createCategory.mutate(
        { name, description: description || undefined },
        {
          onSuccess: () => setIsDialogOpen(false),
          onError: (error: ApiError) => setErrors({ submit: error.detail }),
        },
      );
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Eliminar la categoria "${name}"?`)) {
      deleteCategory.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/catalogo">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organiza tus productos por categoria</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Categoria' : 'Nueva Categoria'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bebidas"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripcion de la categoria"
                />
              </div>
              {errors.submit && <p className="text-xs text-destructive">{errors.submit}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
                  {editingId ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !categories?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No hay categorias</p>
              <p className="text-sm text-muted-foreground">
                Crea tu primera categoria para organizar tus productos
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpen(category.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deleteCategory.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
