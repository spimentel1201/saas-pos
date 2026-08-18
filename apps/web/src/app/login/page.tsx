'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { Check, Package, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const benefits = [
  { icon: Zap, text: 'Configuración en 15 minutos' },
  { icon: Package, text: 'Inventario offline-first' },
  { icon: Shield, text: 'Caja y arqueo automáticos' },
  { icon: Check, text: '14 días gratis sin tarjeta' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
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
            <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
            <CardDescription>Accede a tu punto de venta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {login.isError && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {login.error.detail || 'Credenciales inválidas'}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                Crear una
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
