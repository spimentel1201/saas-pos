'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleX,
  Clock,
  CreditCard,
  HardDrive,
  Package,
  Shield,
  Smartphone,
  Star,
  Tag,
  Users,
  Zap,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type IconType = ComponentType<{ className?: string }>;

const painPoints = [
  '¿Usas Excel o un cuaderno para llevar tu inventario?',
  '¿Se te pierden productos porque no hay control de stock?',
  '¿Cierras caja con diferencias que no puedes explicar?',
  '¿Tienes que ir a la tienda para saber cuánto vendiste?',
  '¿Tu POS actual no funciona cuando se va el internet?',
];

type Feature = { icon: IconType; title: string; desc: string; group: string };

const features: Feature[] = [
  {
    icon: CreditCard,
    title: 'Caja y arqueo',
    desc: 'Apertura con fondo, movimientos IN/OUT, arqueo por denominaciones, cierre Z automático.',
    group: 'caja',
  },
  {
    icon: Zap,
    title: 'Velocidad de cajero',
    desc: 'Diseñado para turnos de 12 horas. Touch targets grandes, atajos de teclado, escaneo rápido.',
    group: 'caja',
  },
  {
    icon: Tag,
    title: 'Códigos de barras',
    desc: 'Genera EAN-13, Code128 y QR por producto. Imprime etiquetas directamente desde el sistema.',
    group: 'caja',
  },
  {
    icon: Package,
    title: 'Inventario completo',
    desc: 'Stock por sucursal, alertas de mínimos, transferencias entre locales, ajustes auditados.',
    group: 'inventario',
  },
  {
    icon: Users,
    title: 'Multi-sucursal',
    desc: 'Administra todas tus tiendas desde un solo lugar. Cada sucursal con su caja y su stock.',
    group: 'inventario',
  },
  {
    icon: HardDrive,
    title: 'Funciona offline',
    desc: 'Vende sin internet. Cuando vuelve la conexión, todo se sincroniza solo. Nunca pierdas una venta.',
    group: 'negocio',
  },
  {
    icon: BarChart3,
    title: 'Reportes claros',
    desc: 'Ventas, utilidad, inventario valorizado, top productos. Exporta a CSV o Excel cuando quieras.',
    group: 'negocio',
  },
  {
    icon: Smartphone,
    title: 'Desde tu celular',
    desc: 'Accede desde cualquier dispositivo. La app se instala como PWA sin ir a la tienda de apps.',
    group: 'negocio',
  },
];

// Las 8 capacidades se agrupan en 3 bloques: una lista plana con hairline por fila
// sería la maqueta por defecto más perezosa. Tres familias de composición distintas.
const featureGroups = [
  { key: 'caja', title: 'En la caja', span: 'lg:col-span-7', tone: 'bg-card' },
  { key: 'inventario', title: 'Tu inventario', span: 'lg:col-span-5', tone: 'bg-primary/5' },
  { key: 'negocio', title: 'Tu negocio, donde sea', span: 'lg:col-span-12', tone: 'bg-muted/50' },
].map((group) => ({ ...group, items: features.filter((f) => f.group === group.key) }));

const steps = [
  {
    title: 'Crea tu cuenta',
    desc: 'Regístrate en 2 minutos. 14 días de prueba gratis, sin tarjeta de crédito.',
    icon: Zap,
  },
  {
    title: 'Agrega tus productos',
    desc: 'Importa tu catálogo por CSV o agrégalo uno por uno. Genera códigos de barras al instante.',
    icon: Package,
  },
  {
    title: 'Empieza a vender',
    desc: 'Abre caja, escanea productos, cobra. El sistema hace el resto: reportes, stock, arqueo.',
    icon: BarChart3,
  },
];

// Separados en destacado + resto para evitar indexar un array en JSX
// (noUncheckedIndexedAccess los marcaría como posiblemente indefinidos).
const featuredTestimonial = {
  name: 'María García',
  role: 'Dueña de Bodega "La Esquina"',
  text: 'Pasé de Excel a este POS en un día. Ahora sé exactamente cuánto vendo y cuánto stock tengo. El modo offline me salvó cuando se cortó la luz.',
  rating: 5,
};

const otherTestimonials = [
  {
    name: 'Carlos Mendoza',
    role: 'Gerente de MiniMarket Express',
    text: 'Tengo 3 sucursales y antes usaba 3 sistemas diferentes. Ahora todo está unificado. El arqueo de caja cuadra siempre.',
    rating: 5,
  },
  {
    name: 'Ana Rodríguez',
    role: 'Farmacia San Juan',
    text: 'Los códigos de barras me ahorraron horas de trabajo. Los reportes me ayudan a tomar decisiones. Muy recomendado.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'S/ 79',
    period: '/mes',
    desc: 'Para comercios con 1 tienda',
    features: ['1 sucursal', '200 productos', '1 cajero', 'Inventario básico', 'Reportes'],
    cta: 'Crear cuenta',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 'S/ 199',
    period: '/mes',
    desc: 'Para negocios en crecimiento',
    features: [
      'Hasta 5 sucursales',
      'Productos ilimitados',
      '5 cajeros por tienda',
      'Transferencias',
      'Reportes avanzados',
      'Import CSV',
    ],
    cta: 'Crear cuenta',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'S/ 499',
    period: '/mes',
    desc: 'Para redes de tiendas',
    features: [
      'Sucursales ilimitadas',
      'Todo de Growth',
      'API access',
      'Soporte prioritario',
      'Usuarios ilimitados',
      'Multi-almacén',
    ],
    cta: 'Contactar',
    highlighted: false,
  },
];

// Cifras pendientes de datos reales (se sustituyen en cuanto haya métricas de uso).
const stats = [
  { value: '50+', label: 'Tiendas activas' },
  { value: '15K+', label: 'Ventas procesadas' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<15min', label: 'Setup promedio' },
];

const heroTrust = ['Sin tarjeta de crédito', 'Configuración en 15 min', 'Soporte en español'];

const badges = [
  { icon: Shield, label: 'Datos encriptados' },
  { icon: Clock, label: '99.9% uptime' },
  { icon: HardDrive, label: 'Offline-first' },
];

function In({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} de 5 estrellas`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden />
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col" suppressHydrationWarning>
      {/* Header: una sola línea, 64px de alto */}
      <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-bold tracking-tight">POS SaaS</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden h-11 sm:inline-flex sm:h-9">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild className="btn-press h-11 sm:h-9">
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* .landing marca la raíz: globals.css usa :has(.landing) para suavizar el
          modo claro SOLO aquí, sin tocar los tokens del resto de la app. */}
      <main className="landing flex-1">
        {/* Hero: split asimétrico 7 / 5. Sin eyebrow de versión, sin franja de
            confianza dentro del hero (va a su propia sección debajo). */}
        <section className="px-4 pt-12 pb-10 sm:px-6 sm:pt-16 lg:pt-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-7">
              <In>
                <h1>
                  Tu punto de venta en la nube.{' '}
                  <span className="text-primary">Sin complicaciones.</span>
                </h1>
              </In>
              <In delay={0.08}>
                <p className="mt-5 max-w-xl text-base sm:text-lg">
                  Inventario, ventas, caja, reportes y códigos de barra. Funciona offline.
                  Multi-sucursal. Diseñado para comercios reales en Perú.
                </p>
              </In>
              <In delay={0.16}>
                <Button size="lg" asChild className="btn-press mt-7">
                  <Link href="/signup">
                    Crear cuenta
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </In>
            </div>

            <In delay={0.12} className="lg:col-span-5">
              <figure className="shot-frame">
                <Image
                  src="/pos-venta.png"
                  alt="Punto de venta POS SaaS: catálogo de productos, carrito con tres artículos y total con IGV"
                  width={1296}
                  height={886}
                  priority
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="h-auto w-full"
                />
              </figure>
            </In>
          </div>
        </section>

        {/* Franja de confianza: fuera del hero, bajo el CTA principal */}
        <section className="border-y bg-muted/40 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-foreground/75 sm:flex-row sm:items-center sm:gap-8">
            {heroTrust.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Cifras */}
        <section className="px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="num text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Puntos de dolor */}
        <section className="border-y bg-muted/40 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2>¿Te suena familiar?</h2>
            </Reveal>
            <Reveal delay={0.05} className="mt-7 space-y-3 sm:mt-8">
              {painPoints.map((p) => (
                <div
                  key={p}
                  className="pain-item flex items-start gap-3 rounded-lg px-4 py-3 text-muted-foreground"
                >
                  <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
                  <span className="text-sm sm:text-base">{p}</span>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-7 text-base font-medium text-foreground sm:mt-8 sm:text-lg">
                Tu negocio merece algo mejor que un cuaderno o un Excel.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Capacidades: 8 elementos en 3 bloques con composiciones distintas */}
        <section className="px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2>Todo lo que necesitas, nada que no</h2>
              <p className="mt-3 text-sm sm:text-base">
                Un sistema completo para manejar tu negocio. Sin módulos extra, sin costos ocultos.
              </p>
            </Reveal>

            <div className="mt-9 grid gap-4 sm:mt-10 lg:grid-cols-12">
              {featureGroups.map((group, i) => (
                <Reveal
                  key={group.key}
                  delay={i * 0.06}
                  className={`${group.span} ${group.tone} rounded-xl border p-5 sm:p-6`}
                >
                  <h3 className="text-base sm:text-lg">{group.title}</h3>
                  <ul
                    className={
                      group.key === 'negocio' ? 'mt-4 grid gap-5 sm:grid-cols-3' : 'mt-4 space-y-5'
                    }
                  >
                    {group.items.map((f) => {
                      const Icon = f.icon;
                      return (
                        <li key={f.title} className="flex gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" aria-hidden />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold sm:text-base">
                              {f.title}
                            </span>
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {f.desc}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo empiezas: línea de tiempo, sin etiquetas de paso numeradas */}
        <section className="border-y bg-muted/40 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2>Empieza en 3 pasos</h2>
            </Reveal>
            <Reveal delay={0.05} className="mt-9">
              <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-border md:block"
                />
                {steps.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.title} className="relative">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <h3 className="mt-4 text-base sm:text-lg">{s.title}</h3>
                      <p className="mt-2 text-sm">{s.desc}</p>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* Testimonios: destacado a la izquierda, los otros dos apilados */}
        <section className="px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2>Lo que dicen nuestros usuarios</h2>
              <p className="mt-3 text-sm sm:text-base">
                Más de 50 comercios en Perú ya confían en POS SaaS para su negocio.
              </p>
            </Reveal>

            <Reveal delay={0.05} className="mt-9 grid gap-4 lg:grid-cols-12">
              <figure className="card rounded-xl border bg-card lg:col-span-5">
                <Stars count={featuredTestimonial.rating} />
                <blockquote className="mt-4 text-base sm:text-lg">
                  &ldquo;{featuredTestimonial.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5">
                  <span className="block text-sm font-medium">{featuredTestimonial.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {featuredTestimonial.role}
                  </span>
                </figcaption>
              </figure>

              <div className="grid gap-4 lg:col-span-7">
                {otherTestimonials.map((t) => (
                  <figure key={t.name} className="card rounded-xl border bg-card">
                    <Stars count={t.rating} />
                    <blockquote className="mt-3 text-sm sm:text-base">
                      &ldquo;{t.text}&rdquo;
                    </blockquote>
                    <figcaption className="mt-4">
                      <span className="block text-sm font-medium">{t.name}</span>
                      <span className="block text-sm text-muted-foreground">{t.role}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Planes */}
        <section className="border-y bg-muted/40 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2>Planes simples, sin sorpresas</h2>
              <p className="mt-3 text-sm sm:text-base">
                Empieza gratis. Escala cuando tu negocio crezca. Cancela cuando quieras.
              </p>
            </Reveal>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {plans.map((plan, i) => (
                <Reveal
                  key={plan.name}
                  delay={i * 0.06}
                  className={`card rounded-xl border bg-card ${
                    plan.highlighted ? 'pricing-highlight' : ''
                  }`}
                >
                  {plan.highlighted && (
                    <span className="mb-3 inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                      Más popular
                    </span>
                  )}
                  <h3 className="text-lg">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="num text-3xl font-bold sm:text-4xl">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-sm">{plan.desc}</p>
                  <ul className="mt-4 space-y-2 sm:mt-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="btn-press mt-5 h-11 w-full sm:mt-6"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/signup">{plan.cta}</Link>
                  </Button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Sellos de confianza */}
        <section className="px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-muted-foreground sm:flex-row sm:justify-between sm:gap-0 sm:divide-x sm:divide-border">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="flex items-center gap-2 px-0 sm:px-6 sm:first:pl-0">
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="text-xs font-medium sm:text-sm">{b.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Cierre */}
        <section className="cta-gradient px-4 py-16 text-center text-white sm:px-6 sm:py-20">
          <Reveal className="mx-auto max-w-2xl">
            <h2 className="text-white">¿Listo para dejar el cuaderno?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/90 sm:text-base">
              14 días gratis. Sin tarjeta de crédito. Configura tu negocio en menos de 15 minutos.
            </p>
            <Button size="lg" variant="secondary" className="btn-press mt-6 sm:mt-8" asChild>
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </Reveal>
        </section>
      </main>

      <footer className="border-t px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-medium text-foreground">POS SaaS</span>
          <span suppressHydrationWarning>© {new Date().getFullYear()} POS SaaS</span>
        </div>
      </footer>
    </div>
  );
}
