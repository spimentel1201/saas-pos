'use client';

import { OfflineIndicator } from '@/components/offline-indicator';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useOpenSessionByBranch } from '@/hooks/queries/use-cash';
import { useUser } from '@/hooks/use-auth';
import { useCartStore } from '@/hooks/use-cart';
import { ChevronDown, MapPin, Menu, Search, Wallet } from 'lucide-react';

const BRANCHES = [
  { code: '', name: 'Todas' },
  { code: 'CEN01', name: 'Lima Centro' },
  { code: 'NOR01', name: 'Norte' },
  { code: 'SUR01', name: 'Sur' },
];

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const branchCode = useCartStore((s) => s.branchCode);
  const setBranch = useCartStore((s) => s.setBranch);
  const { data: user } = useUser();
  const { data: openSession } = useOpenSessionByBranch(branchCode);

  const currentBranch = BRANCHES.find((b) => b.code === branchCode) ?? BRANCHES[0];
  const branchName = currentBranch?.name ?? 'Sin sede';
  const branchCodeLabel = currentBranch?.code ?? '';
  const displayName = user?.name || 'Usuario';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-14 items-center gap-2 bg-card px-3 sm:h-16 sm:gap-4 sm:px-6">
      {/* Mobile menu button */}
      {onMenuToggle && (
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Branch selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden text-sm font-medium sm:inline" suppressHydrationWarning>
              {branchName}
            </span>
            <span className="text-xs text-muted-foreground sm:hidden" suppressHydrationWarning>
              {branchCodeLabel}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {BRANCHES.map((b) => (
            <DropdownMenuItem
              key={b.code}
              onClick={() => setBranch(b.code)}
              className={branchCode === b.code ? 'bg-primary/10 text-primary' : ''}
            >
              <MapPin className="mr-2 h-3.5 w-3.5" />
              {b.name}
              <span className="ml-2 text-xs text-muted-foreground">{b.code}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cash session indicator */}
      {openSession ? (
        <Badge
          variant="default"
          className="gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"
        >
          <Wallet className="h-3 w-3" />
          <span className="hidden sm:inline">Caja abierta</span>
          <span className="hidden sm:inline text-xs font-normal">
            S/ {openSession.openingBalance.toFixed(2)}
          </span>
        </Badge>
      ) : null}

      {/* Search - hidden on mobile, visible on sm+ */}
      <div className="relative hidden w-full max-w-md sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar productos, boletas..."
          className="bg-muted pl-10 text-sm placeholder:text-muted-foreground"
        />
      </div>

      {/* Mobile search icon */}
      <Button variant="ghost" size="icon" className="shrink-0 sm:hidden">
        <Search className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="hidden h-5 w-px bg-border sm:block" />
        <OfflineIndicator />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block" suppressHydrationWarning>
            <p className="text-sm font-medium" suppressHydrationWarning>
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {branchName}
            </p>
          </div>
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
            <AvatarFallback className="bg-primary/20 text-primary text-xs" suppressHydrationWarning>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
