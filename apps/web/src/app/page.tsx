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
  Tag,
  Users,
  Zap,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
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
// sería la maqueta por defecto más perezosa. Tres familias de composición distintas
// y tres rellenos neutros — el azul queda solo para lo accionable.
const featureGroups = [
  { key: 'caja', title: 'En la caja', span: 'lg:col-span-7', tone: 'bg-card' },
  { key: 'inventario', title: 'Tu inventario', span: 'lg:col-span-5', tone: 'bg-muted/50' },
  {
    key: 'negocio',
    title: 'Tu negocio, donde sea',
    span: 'lg:col-span-12',
    tone: 'bg-transparent',
  },
].map((group) => ({ ...group, items: features.filter((f) => f.group === group.key) }));

const steps = [
  {
    title: 'Crea tu cuenta',
    desc: 'Regístrate en 2 minutos. 14 días de prueba gratis.',
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

// Capturas reales de la app, tomadas con datos de prueba. Cada una corresponde
// al bloque de capacidades de su lado: caja, catálogo/stock y reportes.
const proofShots = [
  {
    src: '/proof-caja.png',
    alt: 'Salkhi: gestión de caja con sesión abierta, monto de apertura y balance esperado',
    caption: 'Sesiones de caja con apertura, movimientos y arqueo',
    span: 'lg:col-span-5',
    sizes: '(min-width: 1024px) 40vw, 100vw',
  },
  {
    src: '/proof-catalogo.png',
    alt: 'Salkhi: catálogo de doce productos con SKU, precio, stock y estado activo',
    caption: 'Catálogo con SKU, precio y stock por producto',
    span: 'lg:col-span-7',
    sizes: '(min-width: 1024px) 58vw, 100vw',
  },
  {
    src: '/proof-reportes.png',
    alt: 'Salkhi: reportes con ventas totales, utilidad, unidades y productos más vendidos',
    caption: 'Ventas, utilidad y top productos en un solo reporte',
    span: 'lg:col-span-12',
    sizes: '(min-width: 1024px) 95vw, 100vw',
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
    cta: 'Crear cuenta',
    highlighted: false,
  },
];

// Cifras pendientes de datos reales (se sustituyen en cuanto haya métricas de uso).
// Van en el hero: una sección de cuatro números no justificaba su propio bloque.
const stats = [
  { value: '50+', label: 'Tiendas activas' },
  { value: '15K+', label: 'Ventas procesadas' },
  { value: '99.9%', label: 'Uptime' },
];

const heroTrust = ['Sin tarjeta de crédito', 'Sin permanencia', 'Soporte en español'];

const navLinks = [
  { href: '#capacidades', label: 'Capacidades' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#planes', label: 'Planes' },
];

const badges = [
  { icon: Shield, label: 'Datos encriptados' },
  { icon: Clock, label: '99.9% uptime' },
  { icon: HardDrive, label: 'Offline-first' },
];

const AURORA_VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

const AURORA_FS = `precision mediump float;
uniform vec2 u_res;uniform float u_t;uniform vec2 u_m;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);
return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);}
float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}
void main(){
vec2 uv=gl_FragCoord.xy/u_res;
vec2 p=vec2(uv.x*(u_res.x/u_res.y),uv.y);
float t=u_t*0.06;
float n=fbm(p*2.2+vec2(t*1.2,-t*0.7));
float band=sin(p.y*3.0+n*2.4-t*1.6)*0.5+0.5;
float glow=smoothstep(0.35,1.0,band)*0.5;
float d=distance(uv,u_m);
glow+=0.30/(1.0+d*d*16.0);
vec3 c1=vec3(0.22,0.47,0.98);
vec3 c2=vec3(0.47,0.33,0.97);
vec3 col=mix(c1,c2,clamp(uv.x+n*0.35-0.15,0.0,1.0));
gl_FragColor=vec4(col,clamp(glow,0.0,0.5));}`;

// Aurora del hero: shader WebGL crudo, sin three.js (serían ~600 KB gzipped para
// lo mismo). Cuatro salvaguardas: se monta tras la hidratación para que el LCP
// (el h1 y la captura) pinte antes; es decorativo (aria-hidden, pointer-events
// none); con prefers-reduced-motion dibuja UN frame y deja de pedir cuadros; y
// sin WebGL cae al degradado CSS de .aurora[data-fallback].
function Aurora() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fail = () => canvas.setAttribute('data-fallback', 'true');
    // Nunca loseContext(): si este efecto volviera a correr, getContext devolvería null.
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      fail();
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, AURORA_VS);
    const fs = compile(gl.FRAGMENT_SHADER, AURORA_FS);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      fail();
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      fail();
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    if (!buffer) {
      fail();
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Triángulo a pantalla completa: un solo draw call.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const attrib = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(attrib);
    gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_t');
    const uMouse = gl.getUniformLocation(program, 'u_m');

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = media.matches;
    let visible = true;
    let start = 0;
    let raf = 0;
    let drawnStatic = false;
    const mouse = { x: 0.76, y: 0.58 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const draw = (time: number) => {
      resize();
      if (!start) start = time;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 6 : (time - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (time: number) => {
      if (reduced) {
        if (!drawnStatic) {
          draw(time);
          drawnStatic = true;
        }
      } else {
        drawnStatic = false;
        if (visible && !document.hidden) draw(time);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) / rect.width;
      mouse.y = 1 - (event.clientY - rect.top) / rect.height;
    };
    const onMedia = () => {
      reduced = media.matches;
    };

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) visible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    window.addEventListener('pointermove', onMove, { passive: true });
    media.addEventListener('change', onMedia);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      media.removeEventListener('change', onMedia);
      observer.disconnect();
      ro.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="aurora" />;
}

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
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : delay, ease: EASE }}
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
      transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:border focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      {/* Header: navegación por anclas desde lg, sin hamburguesa */}
      <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="text-lg font-bold tracking-tight">Salkhi</span>
          <nav aria-label="Secciones" className="hidden lg:flex lg:items-center lg:gap-7">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
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
      <main id="contenido" className="landing flex-1">
        {/* Hero: split asimétrico 7 / 5 con la aurora WebGL detrás. La máscara
            de CSS apaga el canvas bajo la columna de texto para no tocar el
            contraste; en móvil, donde el texto ocupa el alto, gira a vertical. */}
        <section className="relative px-4 pt-12 pb-10 sm:px-6 sm:pt-16 lg:pt-20">
          <div className="aurora-wrap" aria-hidden="true">
            <Aurora />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-12 lg:gap-6">
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

              <In delay={0.24} className="mt-9">
                <div className="grid max-w-lg grid-cols-3 gap-4 sm:gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="num text-2xl font-bold text-foreground sm:text-3xl">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </In>
            </div>

            <In delay={0.12} className="lg:col-span-5">
              <figure className="shot-frame">
                <Image
                  src="/pos-venta.png"
                  alt="Salkhi: catálogo de productos, carrito con tres artículos y total con IGV"
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

        {/* Franja de confianza: sin banda de fondo, hereda la del hero */}
        <section aria-label="Condiciones de la prueba" className="px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-foreground/85 sm:flex-row sm:items-center sm:gap-8">
            {heroTrust.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Puntos de dolor: panel inset en vez de franja a todo el ancho */}
        <section className="px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2>¿Te suena familiar?</h2>
            </Reveal>
            <Reveal delay={0.05} className="mt-7 rounded-2xl border bg-muted/60 p-5 sm:mt-8 sm:p-6">
              <ul className="space-y-3 sm:space-y-4">
                {painPoints.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-muted-foreground">
                    <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
                    <span className="text-sm sm:text-base">{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <p className="mt-7 text-base font-medium text-foreground sm:mt-8 sm:text-lg">
              Tu negocio merece algo mejor que un cuaderno o un Excel.
            </p>
          </div>
        </section>

        {/* Capacidades: 8 elementos en 3 bloques con composiciones distintas */}
        <section id="capacidades" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2>Todo lo que necesitas, nada que no</h2>
              <p className="mt-3 text-sm sm:text-base">
                Un sistema completo para manejar tu negocio. Sin módulos extra, sin costos ocultos.
              </p>
            </Reveal>

            <div className="mt-9 grid gap-4 sm:mt-10 lg:grid-cols-12">
              {featureGroups.map((group) => (
                <div
                  key={group.key}
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
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo empiezas: línea de tiempo, sin etiquetas de paso numeradas */}
        <section id="como-funciona" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2>Empieza en 3 pasos</h2>
            </Reveal>
            <ol className="relative mt-9 grid gap-8 md:grid-cols-3 md:gap-6">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-border md:block"
              />
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="relative">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card text-foreground">
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-base sm:text-lg">{s.title}</h3>
                    <p className="mt-2 text-sm">{s.desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Prueba de producto: capturas reales mapeadas a los 3 bloques de arriba */}
        <section className="px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2>Así se ve funcionando</h2>
              <p className="mt-3 text-sm sm:text-base">
                Capturas reales del producto con datos de prueba. Más de 50 comercios en Perú ya
                confían en Salkhi para su negocio.
              </p>
            </Reveal>

            <div className="mt-9 grid items-start gap-5 sm:mt-10 lg:grid-cols-12">
              {proofShots.map((shot) => (
                <figure key={shot.src} className={shot.span}>
                  <div className="shot-frame">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={1440}
                      height={900}
                      sizes={shot.sizes}
                      className="h-auto w-full"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm text-muted-foreground">
                    {shot.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Planes */}
        <section id="planes" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2>Planes simples, sin sorpresas</h2>
              <p className="mt-3 text-sm sm:text-base">
                Empieza gratis. Escala cuando tu negocio crezca. Cancela cuando quieras.
              </p>
            </Reveal>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
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
                        <Check className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className="cta-gradient px-4 py-16 text-center text-white sm:px-6 sm:py-20">
          <Reveal className="mx-auto max-w-2xl">
            <h2 className="text-white">¿Listo para dejar el cuaderno?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/90 sm:text-base">
              14 días gratis. Configura tu negocio en menos de 15 minutos.
            </p>
            <Button size="lg" variant="secondary" className="btn-press mt-6 sm:mt-8" asChild>
              <Link href="/signup">Crear cuenta</Link>
            </Button>
          </Reveal>
        </section>
      </main>

      <footer className="border-t px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-foreground">Salkhi</span>
            <nav aria-label="Pie de página" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href="#capacidades" className="text-muted-foreground hover:text-foreground">
                Capacidades
              </a>
              <a href="#planes" className="text-muted-foreground hover:text-foreground">
                Planes
              </a>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Iniciar sesión
              </Link>
              <Link href="/signup" className="font-medium text-foreground">
                Crear cuenta
              </Link>
            </nav>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t pt-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <span key={b.label} className="flex items-center gap-2 text-xs sm:text-sm">
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    {b.label}
                  </span>
                );
              })}
            </div>
            <span className="text-xs sm:text-sm" suppressHydrationWarning>
              © {new Date().getFullYear()} Salkhi
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
