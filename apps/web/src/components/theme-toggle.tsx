'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled className="h-8 w-8">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Cambiar tema</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
