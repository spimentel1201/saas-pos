import './globals.css';

export const metadata = {
  title: 'POS SaaS — Punto de venta multi-sucursal en la nube',
  description:
    'SaaS POS para comercios de América Latina: inventario, ventas, caja, reportes y códigos de barra/QR.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
