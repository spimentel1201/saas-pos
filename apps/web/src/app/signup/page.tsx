'use client';

import { useState } from 'react';

type PlanResponse = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  tenantSlug: string;
  tenantId: string;
};

export default function SignupPage() {
  const [form, setForm] = useState({
    businessName: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResponse | null>(null);

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
      setResult(body as PlanResponse);
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está corriendo `pnpm dev`?');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <main>
        <span className="tag">¡Listo!</span>
        <h1>Cuenta creada: {result.tenantSlug}</h1>
        <p>
          Guarda estos tokens en localStorage / cookies. En una app real lo haría el código
          automáticamente.
        </p>
        <pre
          style={{
            background: 'var(--bg-soft)',
            border: '1px solid var(--border)',
            padding: '1rem',
            borderRadius: '0.5rem',
            overflow: 'auto',
            maxWidth: '700px',
            fontSize: '0.85rem',
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
        <p style={{ marginTop: '2rem' }}>
          <a href={`/onboarding?tenant=${result.tenantSlug}`} className="btn">
            Continuar con el wizard de onboarding →
          </a>
        </p>
      </main>
    );
  }

  return (
    <main>
      <span className="tag">Alta de comercio</span>
      <h1>Crea tu cuenta</h1>
      <p>14 días de prueba. No se requiere tarjeta.</p>

      <form onSubmit={submit}>
        <label htmlFor="businessName">Nombre del comercio</label>
        <input
          id="businessName"
          required
          value={form.businessName}
          onChange={update('businessName')}
          placeholder="Tecnomanía SA"
        />

        <label htmlFor="slug">Slug (subdominio)</label>
        <input
          id="slug"
          required
          pattern="[a-z0-9][a-z0-9-]+[a-z0-9]"
          value={form.slug}
          onChange={update('slug')}
          placeholder="tecnomania"
        />

        <label htmlFor="ownerName">Tu nombre</label>
        <input
          id="ownerName"
          required
          value={form.ownerName}
          onChange={update('ownerName')}
          placeholder="Juan Pérez"
        />

        <label htmlFor="ownerEmail">Email</label>
        <input
          id="ownerEmail"
          type="email"
          required
          value={form.ownerEmail}
          onChange={update('ownerEmail')}
          placeholder="juan@tecnomania.com"
        />

        <label htmlFor="password">Contraseña (mín. 10 caracteres)</label>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          value={form.password}
          onChange={update('password')}
          placeholder="**********"
        />

        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>
    </main>
  );
}
