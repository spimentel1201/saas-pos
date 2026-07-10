export default function Page() {
  return (
    <main>
      <span className="tag">Beta privada</span>
      <h1>POS en la nube, multi-sucursal, sin límites.</h1>
      <p>
        Sistema completo de punto de venta para comercios: inventario, ventas, compras, caja,
        reportes y generación de códigos de barra / QR por producto. Funciona offline.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <a href="/signup" className="btn">
          Crear cuenta gratis (14 días)
        </a>
        <a href="/login" className="btn btn-secondary">
          Iniciar sesión
        </a>
      </div>

      <h2>Módulos incluidos</h2>
      <div className="grid">
        <div className="card">
          <h3>Catálogo + códigos</h3>
          <p>Productos, variantes, importación CSV. EAN-13, Code128 y QR.</p>
        </div>
        <div className="card">
          <h3>Inventario</h3>
          <p>Stock por sucursal, transferencias, ajustes, alertas de mínimos.</p>
        </div>
        <div className="card">
          <h3>POS offline-first</h3>
          <p>Vende sin conexión. Sincroniza automáticamente al volver online.</p>
        </div>
        <div className="card">
          <h3>Caja</h3>
          <p>Apertura, recibos, arqueo y corte Z por sucursal y cajero.</p>
        </div>
        <div className="card">
          <h3>Reportes</h3>
          <p>Ventas, utilidad, inventario valorizado, top productos. Export CSV/Excel.</p>
        </div>
        <div className="card">
          <h3>Billing</h3>
          <p>Planes Starter / Growth / Pro. Cancela en cualquier momento.</p>
        </div>
      </div>

      <h2>Stack</h2>
      <p>
        NestJS + PostgreSQL (multi-tenant schema-per-tenant), Next.js PWA, Stripe, Cloudinary, Redis
        + BullMQ. Sin stored procedures —MVs para reportes.
      </p>
      <p style={{ marginTop: '3rem', fontSize: '0.85rem' }}>
        Consulta el plan técnico completo en <code>/PLAN-MVP-POS-SAAS.md</code>.
      </p>
    </main>
  );
}
