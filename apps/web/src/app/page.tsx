'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleX,
  Clock,
  CreditCard,
  HardDrive,
  HeadphonesIcon,
  Package,
  Shield,
  Smartphone,
  Star,
  Tag,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const painPoints = [
  'Usas Excel o cuaderno para llevar tu inventario?',
  'Se te pierden productos porque no hay control de stock?',
  'Cierras caja con diferencias que no puedes explicar?',
  'Tienes que ir a la tienda para saber cuánto vendiste?',
  'Tu POS actual no funciona cuando se va el internet?',
];

const features = [
  {
    icon: HardDrive,
    title: 'Funciona offline',
    desc: 'Vende sin internet. Cuando vuelve la conexion, todo se sincroniza solo. Nunca pierdas una venta.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Package,
    title: 'Inventario completo',
    desc: 'Stock por sucursal, alertas de minimos, transferencias entre locales, ajustes auditados.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Tag,
    title: 'Codigos de barras',
    desc: 'Genera EAN-13, Code128 y QR por producto. Imprime etiquetas directamente desde el sistema.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: CreditCard,
    title: 'Caja y arqueo',
    desc: 'Apertura con fondo, movimientos IN/OUT, arqueo por denominaciones, cierre Z automatico.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: BarChart3,
    title: 'Reportes claros',
    desc: 'Ventas, utilidad, inventario valorizado, top productos. Exporta a CSV o Excel cuando quieras.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Users,
    title: 'Multi-sucursal',
    desc: 'Administra todas tus tiendas desde un solo lugar. Cada sucursal con su caja y su stock.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Smartphone,
    title: 'Desde tu celular',
    desc: 'Accede desde cualquier dispositivo. La app se instala como PWA sin ir a la tienda de apps.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Zap,
    title: 'Velocidad de cajero',
    desc: 'Disenado para turnos de 12 horas. Touch targets grandes, atajos de teclado, escaneo rapido.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
];

const steps = [
  {
    num: '1',
    title: 'Crea tu cuenta',
    desc: 'Registrate en 2 minutos. 14 dias de prueba gratis, sin tarjeta de credito.',
    icon: Zap,
  },
  {
    num: '2',
    title: 'Agrega tus productos',
    desc: 'Importa tu catalogo por CSV o agrégalo uno por uno. Genera codigos de barras al instante.',
    icon: Package,
  },
  {
    num: '3',
    title: 'Empieza a vender',
    desc: 'Abre caja, escanea productos, cobra. El sistema hace el resto: reportes, stock, arqueo.',
    icon: BarChart3,
  },
];

const testimonials = [
  {
    name: 'Maria Garcia',
    role: 'Duena de Bodega "La Esquina"',
    text: 'Pase de Excel a este POS en un dia. Ahora se exactamente cuanto vendo y cuanto stock tengo. El modo offline mesalvo cuando se corto la luz.',
    rating: 5,
  },
  {
    name: 'Carlos Mendoza',
    role: 'Gerente de MiniMarket Express',
    text: 'Tengo 3 sucursales y antes usaba 3 sistemas diferentes. Ahora todo esta unificado. El arqueo de caja cuadra siempre.',
    rating: 5,
  },
  {
    name: 'Ana Rodriguez',
    role: 'Farmacia San Juan',
    text: 'Los codigos de barras me ahorraron horas de trabajo. Los reportes me ayudan a tomar decisiones. Muy recomendado.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 'S/ 79',
    period: '/mes',
    desc: 'Para comercios con 1 tienda',
    features: ['1 sucursal', '200 productos', '1 cajero', 'Inventario basico', 'Reportes'],
    cta: 'Empezar gratis',
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
    cta: 'Empezar gratis',
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
      'Multi-almacen',
    ],
    cta: 'Contactar',
    highlighted: false,
  },
];

const stats = [
  { value: '50+', label: 'Tiendas activas' },
  { value: '15K+', label: 'Ventas procesadas' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<15min', label: 'Setup promedio' },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );

    const children = el.querySelectorAll('.reveal');
    for (const child of children) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function Page() {
  const revealRef = useReveal();

  return (
    <div className="flex min-h-screen flex-col" suppressHydrationWarning ref={revealRef}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <span className="text-lg font-bold tracking-tight">POS SaaS</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="/login">Iniciar sesion</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/signup">Crear cuenta</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
              {/* Text */}
              <div>
                <span className="tag animate-fade-up">Beta privada — 14 dias gratis</span>
                <h1 className="mt-4 animate-fade-up delay-100 sm:mt-6">
                  Tu punto de venta en la nube.{' '}
                  <span className="text-primary">Sin complicaciones.</span>
                </h1>
                <p className="mt-4 max-w-xl text-base text-muted-foreground sm:mt-6 sm:text-lg animate-fade-up delay-200">
                  Inventario, ventas, caja, reportes y codigos de barra. Funciona offline.
                  Multi-sucursal. Disenado para comercios reales en Peru.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row animate-fade-up delay-300">
                  <Button size="lg" asChild className="animate-pulse-glow">
                    <a href="/signup">
                      Probar gratis 14 dias
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="/login">Ver demo</a>
                  </Button>
                </div>
                <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground sm:mt-8 sm:flex-row sm:gap-6 animate-fade-up delay-400">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Sin tarjeta de credito
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Configuracion en 15 min
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Soporte en espanol
                  </div>
                </div>
              </div>

              {/* Mockup */}
              <div className="relative animate-slide-in-right delay-200">
                <div className="mockup-glow rounded-xl border bg-card p-1 sm:p-2">
                  <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
                    <div className="flex items-center gap-2 border-b pb-3">
                      <div className="h-3 w-3 rounded-full bg-destructive/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <div className="h-3 w-3 rounded-full bg-primary/80" />
                      <span className="ml-2 text-xs text-muted-foreground">POS SaaS</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {['Cafe', 'Pan', 'Leche', 'Aceite', 'Arroz', 'Azucar'].map((item) => (
                        <div
                          key={item}
                          className="rounded-md border bg-background p-2 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 sm:p-3"
                        >
                          <div className="mx-auto mb-1 h-6 w-6 rounded bg-muted sm:h-8 sm:w-8" />
                          <p className="text-[10px] font-medium sm:text-xs">{item}</p>
                          <p className="text-[10px] text-primary sm:text-xs">S/ 4.50</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-md border bg-background p-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold">S/ 27.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -left-2 top-6 animate-float sm:-left-4 sm:top-8">
                  <div className="rounded-lg border bg-card p-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 sm:h-8 sm:w-8">
                        <Zap className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium sm:text-xs">Offline-first</p>
                        <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                          Sin internet, funciona
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-3 right-4 animate-float delay-300 sm:-bottom-4 sm:right-8">
                  <div className="rounded-lg border bg-card p-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 sm:h-8 sm:w-8">
                        <BarChart3 className="h-3.5 w-3.5 text-emerald-500 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium sm:text-xs">Reportes real-time</p>
                        <p className="text-[9px] text-muted-foreground sm:text-[10px]">
                          Ventas en tiempo real
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 flex justify-center sm:mt-16">
            <ChevronDown className="h-6 w-6 animate-bounce-down text-muted-foreground/50" />
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-y bg-muted/30 px-4 py-6 sm:px-6">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pain points */}
        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl reveal">
            <h2 className="text-center text-xl font-semibold sm:text-2xl">Te suena familiar?</h2>
            <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
              {painPoints.map((p) => (
                <div
                  key={p}
                  className="pain-item flex items-start gap-3 rounded-lg px-4 py-3 text-muted-foreground"
                >
                  <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <span className="text-sm sm:text-base">{p}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-base font-medium sm:mt-8 sm:text-lg">
              Tu negocio merece algo mejor que un cuaderno o un Excel.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-6xl reveal">
            <h2 className="text-center text-xl font-semibold sm:text-2xl">
              Todo lo que necesitas, nada que no
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
              Un sistema completo para manejar tu negocio. Sin modulos extra, sin costos ocultos.
            </p>
            <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="feature-card card border bg-card">
                    <div
                      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${f.bg} sm:h-12 sm:w-12`}
                    >
                      <Icon className={`h-5 w-5 ${f.color} sm:h-6 sm:w-6`} />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold sm:text-base">{f.title}</h3>
                    <p className="text-xs text-muted-foreground sm:text-sm">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-4xl reveal">
            <h2 className="text-center text-xl font-semibold sm:text-2xl">Empieza en 3 pasos</h2>
            <div className="mt-8 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-3">
              {steps.map((s, _i) => {
                const Icon = s.icon;
                return (
                  <div key={s.num} className="text-center">
                    <div className="relative mx-auto mb-4">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 sm:h-16 sm:w-16">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                      </div>
                      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground sm:h-7 sm:w-7">
                        {s.num}
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-semibold sm:text-lg">{s.title}</h3>
                    <p className="text-xs text-muted-foreground sm:text-sm">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-y bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-6xl reveal">
            <h2 className="text-center text-xl font-semibold sm:text-2xl">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
              Mas de 50 comercios en Peru ya confian en POS SaaS para su negocio.
            </p>
            <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="testimonial-card card border bg-card">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={`star-${t.name}-${i}`}
                        className="h-4 w-4 fill-amber-500 text-amber-500"
                      />
                    ))}
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground sm:text-sm">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-5xl reveal">
            <h2 className="text-center text-xl font-semibold sm:text-2xl">
              Planes simples, sin sorpresas
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
              Empieza gratis. Escala cuando tu negocio crezca. Cancela cuando quieras.
            </p>
            <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`card border bg-card ${plan.highlighted ? 'pricing-highlight' : ''}`}
                >
                  {plan.highlighted && (
                    <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Mas popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold sm:text-4xl">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                  <ul className="mt-4 space-y-2 sm:mt-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-4 w-full sm:mt-6 ${plan.highlighted ? 'animate-pulse-glow' : ''}`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <a href="/signup">{plan.cta}</a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="border-y bg-muted/30 px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 text-muted-foreground sm:gap-10">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium sm:text-sm">Datos encriptados</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium sm:text-sm">99.9% uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium sm:text-sm">Soporte en espanol</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium sm:text-sm">Offline-first</span>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="cta-gradient px-4 py-16 text-center text-white sm:px-6 sm:py-20 md:py-24">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Listo para dejar el cuaderno?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/80 sm:text-base">
              14 dias gratis. Sin tarjeta de credito. Configura tu negocio en menos de 15 minutos.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 animate-pulse-glow sm:mt-8"
              asChild
            >
              <a href="/signup">Crear mi cuenta gratis</a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-medium">POS SaaS</span>
          <div className="flex gap-4">
            <a href="/terminos" className="transition-colors hover:text-foreground">
              Terminos
            </a>
            <a href="/privacidad" className="transition-colors hover:text-foreground">
              Privacidad
            </a>
            <a href="/contacto" className="transition-colors hover:text-foreground">
              Contacto
            </a>
          </div>
          <span suppressHydrationWarning>© {new Date().getFullYear()} POS SaaS</span>
        </div>
      </footer>
    </div>
  );
}
