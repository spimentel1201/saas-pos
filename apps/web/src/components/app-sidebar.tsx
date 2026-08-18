'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConfig } from '@/hooks/queries/use-config';
import { useUser } from '@/hooks/use-auth';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Box,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Store,
  UserCog,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ALL_PATHS = [
  '/app',
  '/app/pos',
  '/app/catalogo',
  '/app/inventario',
  '/app/caja',
  '/app/clientes',
  '/app/usuarios',
  '/app/reportes',
  '/app/config',
];

function getAllowedPaths(role: string | null): string[] {
  switch (role) {
    case 'OWNER':
      return ALL_PATHS;
    case 'ADMIN':
      return ALL_PATHS.filter((p) => p !== '/app/config');
    case 'MANAGER':
      return ALL_PATHS.filter((p) => p !== '/app/config' && p !== '/app/usuarios');
    case 'CASHIER':
      return ['/app', '/app/pos', '/app/caja', '/app/clientes'];
    default:
      return ['/app', '/app/pos', '/app/caja', '/app/clientes'];
  }
}

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { href: '/app/catalogo', label: 'Catalogo', icon: Package },
  { href: '/app/inventario', label: 'Inventario', icon: Box },
  { href: '/app/caja', label: 'Caja', icon: CreditCard },
  { href: '/app/clientes', label: 'Clientes', icon: Users },
  { href: '/app/usuarios', label: 'Usuarios', icon: UserCog },
  { href: '/app/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/app/config', label: 'Configuracion', icon: Settings },
];

interface AppSidebarProps {
  tenantSlug?: string;
}

export function AppSidebar({ tenantSlug }: AppSidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const storeRole = useAuthStore((s) => s.role);
  const tenantSlugStore = useAuthStore((s) => s.tenantSlug);
  const { data: user } = useUser();
  const { data: config } = useConfig();

  const ticketHeader = config?.find((s) => s.key === 'ticket_header')?.value as
    | { businessName?: string }
    | undefined;
  const businessName = ticketHeader?.businessName || 'Mi Negocio';

  const role = user?.tenants?.find((t) => t.slug === tenantSlugStore)?.role ?? storeRole;

  const handleLogout = () => {
    try {
      logout();
    } catch {}
    try {
      document.cookie =
        'access-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
      document.cookie =
        'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
      document.cookie = 'tenant-slug=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
      localStorage.removeItem('pos-auth');
    } catch {}
    setTimeout(() => {
      window.location.replace('/login');
    }, 50);
  };

  const allowedPaths = getAllowedPaths(role);

  const items = navItems
    .filter((item) => allowedPaths.includes(item.href))
    .map((item) => ({
      ...item,
      originalHref: item.href,
      href: tenantSlug ? `/app/${tenantSlug}${item.href.replace('/app', '')}` : item.href,
    }));

  return (
    <aside className="flex h-full w-64 flex-col bg-muted" suppressHydrationWarning>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <span className="text-base font-semibold text-foreground">{businessName}</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isRoot = item.originalHref === '/app';
            const active = isRoot
              ? pathname === item.href || pathname === `${item.href}/`
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                suppressHydrationWarning
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="relative z-10 shrink-0 border-t px-3 py-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
