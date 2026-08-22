import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantSlug: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  role: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setTenant: (tenantSlug: string) => void;
  setAuth: (auth: {
    accessToken: string;
    refreshToken: string;
    tenantSlug: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    role?: string;
  }) => void;
  logout: () => void;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      tenantSlug: null,
      userId: null,
      userName: null,
      userEmail: null,
      role: null,
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        setCookie('access-token', accessToken);
        setCookie('refresh-token', refreshToken);
      },
      setTenant: (tenantSlug) => {
        set({ tenantSlug });
        setCookie('tenant-slug', tenantSlug);
      },
      setAuth: (auth) => {
        set({ ...auth });
        setCookie('access-token', auth.accessToken);
        setCookie('refresh-token', auth.refreshToken);
        setCookie('tenant-slug', auth.tenantSlug);
      },
      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          tenantSlug: null,
          userId: null,
          userName: null,
          userEmail: null,
          role: null,
        });
        removeCookie('access-token');
        removeCookie('refresh-token');
        removeCookie('tenant-slug');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pos-auth');
        }
      },
    }),
    {
      name: 'pos-auth',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          return {
            ...(persistedState as Record<string, unknown>),
            userName: null,
            userEmail: null,
          };
        }
        return persistedState;
      },
    },
  ),
);
