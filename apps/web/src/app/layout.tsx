import { QueryProvider } from '@/components/query-provider';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { ThemeProvider } from '@/components/theme-provider';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// metadataBase: resuelve las URLs de las imágenes sociales. Usa la variable pública si
// existe, cae a VERCEL_URL en producción y a localhost en desarrollo; sin esto Next
// emite el warning "metadataBase property in metadata export is not set" y las OG
// images apuntarían a localhost:3000 (puerto equivocado).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Salkhi: Punto de venta multi-sucursal en la nube',
  description:
    'POS en la nube para comercios de Perú: inventario, ventas, caja, reportes y códigos de barra/QR.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    siteName: 'Salkhi',
    title: 'Salkhi: Punto de venta multi-sucursal en la nube',
    description:
      'POS en la nube para comercios de Perú: inventario, ventas, caja, reportes y códigos de barra/QR.',
    images: [
      {
        url: '/pos-venta.png',
        width: 1296,
        height: 886,
        alt: 'Punto de venta Salkhi con carrito y totales',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salkhi: Punto de venta multi-sucursal en la nube',
    description:
      'Inventario, ventas, caja y reportes. Funciona offline. Multi-sucursal. Diseñado para comercios reales en Perú.',
    images: ['/pos-venta.png'],
  },
};

// Sin maximumScale/userScalable: bloquear el zoom rompe accesibilidad (WCAG 1.4.4).
// themeColor alineado a los tokens de :root y .dark en globals.css (era #6366f1, que no
// coincidía con --primary: 221 83% 53%).
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0d14' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <noscript>
          {/* Motion deja opacity:0 en el HTML de partida y solo lo anima cuando el
              navegador ejecuta requestAnimationFrame. Sin JS, o con la pestaña en
              segundo plano, la landing entera quedaría invisible. Esta hoja la recupera. */}
          <style>{'[style*="opacity:0"]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <ServiceWorkerRegistration />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
