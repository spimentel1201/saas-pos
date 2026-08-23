'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { Check, Package, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const benefits = [
  { icon: Zap, text: 'Configuración en 15 minutos' },
  { icon: Package, text: 'Inventario offline-first' },
  { icon: Shield, text: 'Caja y arqueo automáticos' },
  { icon: Check, text: '14 días gratis sin tarjeta' },
];

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({
    businessName: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [k]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail ?? body.title ?? 'Error en el alta');
        return;
      }
      setAuth({
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        tenantSlug: body.tenantSlug,
        userId: body.userId,
        userName: body.userName,
        userEmail: body.userEmail,
        role: body.primaryRole,
      });
      router.push('/app');
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está corriendo `pnpm dev`?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen" suppressHydrationWarning>
      <div
        className="flex flex-1 flex-col items-center justify-center px-4 py-8"
        suppressHydrationWarning
      >
        <div className="absolute left-4 top-4" suppressHydrationWarning>
          <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-80">
            POS SaaS
          </Link>
        </div>
        <div className="absolute right-4 top-4" suppressHydrationWarning>
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Crea tu cuenta</CardTitle>
            <CardDescription>14 días de prueba. No se requiere tarjeta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessName">Nombre del comercio</Label>
                <Input
                  id="businessName"
                  required
                  value={form.businessName}
                  onChange={update('businessName')}
                  placeholder="Tecnomanía SA"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">Slug (subdominio)</Label>
                <Input
                  id="slug"
                  required
                  pattern="[a-z0-9][a-z0-9-]+[a-z0-9]"
                  value={form.slug}
                  onChange={update('slug')}
                  placeholder="tecnomania"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="ownerName">Tu nombre</Label>
                <Input
                  id="ownerName"
                  required
                  value={form.ownerName}
                  onChange={update('ownerName')}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="ownerEmail">Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  required
                  value={form.ownerEmail}
                  onChange={update('ownerEmail')}
                  placeholder="juan@tecnomania.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña (mín. 10 caracteres)</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={10}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••••"
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando...' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Iniciar sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="hidden flex-1 items-center justify-center bg-muted/50 lg:flex">
        <div className="max-w-md px-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Tu POS en la nube</h2>
            <p className="mt-2 text-muted-foreground">
              Inventario, ventas, caja y reportes. Todo lo que necesitas para manejar tu negocio.
            </p>
          </div>
          <div className="space-y-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.text} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{b.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
