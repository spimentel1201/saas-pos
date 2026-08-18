import { AppShell } from '@/components/app-shell';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'POS SaaS',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
