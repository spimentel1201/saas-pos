'use client';

import { useState } from 'react';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  primaryRole: string;
  tenantSlug: string;
  tenants: Array<{ slug: string; role: string; name: string }>;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as LoginResponse & { detail?: string; title?: string };
      if (!res.ok) {
        setError(body.detail ?? body.title ?? 'Credenciales inválidas');
        return;
      }
      // En una app real guardariamos en cookies httpOnly via server action.
      localStorage.setItem('posAccessToken', body.accessToken);
      localStorage.setItem('posRefreshToken', body.refreshToken);
      window.location.href = body.tenants[0] ? `/app/${body.tenants[0]?.slug}` : '/app';
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <span className="tag">Acceso</span>
      <h1>Iniciar sesión</h1>
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="juan@tecnomania.com"
        />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        ¿No tienes cuenta? <a href="/signup">Crear una</a>.
      </p>
    </main>
  );
}
