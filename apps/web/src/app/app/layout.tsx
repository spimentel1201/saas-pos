import { AppShell } from '@/components/app-shell';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Salkhi',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
