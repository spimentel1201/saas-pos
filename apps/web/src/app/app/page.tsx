'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useDailySales,
  useDashboardKPIs,
  useSalesByCategory,
  useSalesByPayment,
  useSalesByProduct,
} from '@/hooks/queries/use-reports';
import { useCartStore } from '@/hooks/use-cart';
import { date, formatPEN } from '@/lib/formatters';
import { AlertTriangle, ArrowUpRight, FileText, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Period = 'today' | 'week' | 'month';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

const PAYMENT_COLORS: Record<string, string> = {
  CASH: 'hsl(var(--chart-1))',
  CARD: 'hsl(var(--chart-2))',
  TRANSFER: 'hsl(var(--chart-3))',
  CREDIT: 'hsl(var(--chart-4))',
  YAPE: 'hsl(var(--chart-5))',
  PLIN: 'hsl(var(--chart-6))',
  MIXED: 'hsl(var(--chart-7))',
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  CREDIT: 'Crédito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  MIXED: 'Mixto',
};

function periodRange(period: Period): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString();
  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { from: start.toISOString(), to };
  }
  if (period === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { from: start.toISOString(), to };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: start.toISOString(), to };
}

// Días del rango seleccionado (para rellenar los que no tienen ventas)
function daysBetween(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  trend,
  trendLabel,
  link,
}: {
  title: string;
  value: string;
  icon: typeof TrendingUp;
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  link?: string;
}) {
  const content = (
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{value}</p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${iconColor}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : null}
            {Math.abs(trend)}%
          </span>
          {trendLabel}
        </div>
      )}
      {link && <p className="mt-3 text-xs text-muted-foreground">Ver detalle →</p>}
    </CardContent>
  );

  if (link) {
    return (
      <Card className="bg-card transition-colors hover:bg-accent/50">
        <Link href={link} className="block">
          {content}
        </Link>
      </Card>
    );
  }

  return <Card className="bg-card">{content}</Card>;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export default function DashboardPage() {
  const branchCode = useCartStore((s) => s.branchCode);
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const [period, setPeriod] = useState<Period>('week');

  const range = useMemo(
    () => ({
      ...periodRange(period),
      ...(branchCode ? { branchId: branchCode } : {}),
    }),
    [period, branchCode],
  );
  const { data: dailySales, isLoading: salesLoading } = useDailySales(range);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of dailySales ?? []) {
      const key = r.day.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + r.grossTotal);
    }
    // Rellenar todos los días del rango (ceros si no hubo ventas)
    const fromDate = new Date(range.from ?? new Date());
    const toDate = new Date(range.to ?? new Date());
    return daysBetween(fromDate, toDate).map((date) => ({
      date,
      ventas: Number((map.get(date) ?? 0).toFixed(2)),
    }));
  }, [dailySales, range.from, range.to]);

  const { data: payments } = useSalesByPayment(range);
  const paymentData = useMemo(
    () =>
      (payments ?? []).map((p) => ({
        name: PAYMENT_LABELS[p.method] ?? p.method,
        value: p.totalAmount,
        method: p.method,
      })),
    [payments],
  );

  const { data: topProducts } = useSalesByProduct({ ...range, limit: 5 });
  const topProductData = useMemo(
    () => (topProducts ?? []).map((p) => ({ name: p.productName, ventas: p.totalRevenue })),
    [topProducts],
  );

  const { data: categories } = useSalesByCategory(range);
  const categoryTotal = useMemo(
    () => (categories ?? []).reduce((acc, c) => acc + c.grossTotal, 0),
    [categories],
  );

  const periodLabel =
    period === 'today' ? 'Hoy' : period === 'week' ? 'Últimos 7 días' : 'Mes actual';
  const serieTotal = chartData.reduce((acc, d) => acc + d.ventas, 0);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-4">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Ventas del Dia"
              value={kpis ? formatPEN(kpis.todaySales) : formatPEN(0)}
              icon={TrendingUp}
              iconColor="bg-emerald-500/10"
              link="/app/reportes"
            />
            <StatCard
              title="Tickets Emitidos"
              value={kpis?.todayTransactions?.toString() ?? '0'}
              icon={FileText}
              iconColor="bg-primary/10"
            />
            <StatCard
              title="Stock Critico"
              value={kpis?.lowStockProducts?.toString()?.padStart(2, '0') ?? '00'}
              icon={AlertTriangle}
              iconColor="bg-amber-500/10"
              link="/app/inventario"
            />
            <StatCard
              title="Clientes Activos"
              value={kpis?.activeCustomers?.toString() ?? '0'}
              icon={Wallet}
              iconColor="bg-cyan-500/10"
              link="/app/clientes"
            />
          </>
        )}
      </div>

      {/* Sales trend chart with period switcher */}
      <Card className="bg-card">
        <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Ventas</CardTitle>
            <p className="text-xs text-muted-foreground">
              {periodLabel} · {formatPEN(serieTotal)}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-56 sm:h-72">
            {salesLoading ? (
              <div className="h-full animate-pulse rounded bg-muted" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => date(v, { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatPEN(value as number), 'Ventas']}
                    labelFormatter={(v) =>
                      date(String(v), { weekday: 'long', day: '2-digit', month: 'long' })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sin datos de ventas en el {periodLabel.toLowerCase()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments + Top products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ventas por Metodo de Pago</CardTitle>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56 sm:h-64">
              {paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {paymentData.map((entry) => (
                        <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method] ?? '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatPEN(value as number)}
                    />
                    <Legend
                      iconType="circle"
                      formatter={(value: string) => (
                        <span className="text-xs capitalize">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin datos de pagos en el {periodLabel.toLowerCase()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Productos</CardTitle>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-56 sm:h-64">
              {topProductData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      hide
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatPEN(value as number)}
                    />
                    <Bar dataKey="ventas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin datos de productos en el {periodLabel.toLowerCase()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Ticket Promedio ({periodLabel.toLowerCase()})</p>
              <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10">
                {periodLabel}
              </Badge>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {serieTotal > 0
                ? formatPEN(serieTotal / (kpis?.todayTransactions || 1))
                : formatPEN(0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kpis?.todayTransactions ?? 0} transacciones
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-sm font-medium">Sucursales Activas</p>
            <p className="mt-3 text-2xl font-bold">{kpis?.activeBranches ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kpis?.activeCustomers ?? 0} clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <p className="text-sm font-medium">
              Ingresos por Categoria ({periodLabel.toLowerCase()})
            </p>
            <p className="mt-3 text-2xl font-bold">{formatPEN(categoryTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(categories ?? []).length} categorias con ventas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Acciones Rapidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/app/reportes"
            className="flex items-center gap-3 rounded-lg bg-muted p-3 transition-colors hover:bg-muted/80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Ver Reportes</p>
              <p className="text-xs text-muted-foreground">Ventas, categorias, inventario</p>
            </div>
          </Link>

          <Link
            href="/app/inventario"
            className="flex items-center gap-3 rounded-lg bg-muted p-3 transition-colors hover:bg-muted/80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Stock Critico</p>
              <p className="text-xs text-muted-foreground">
                {kpis?.lowStockProducts ?? 0} productos
              </p>
            </div>
          </Link>

          <Link
            href="/app/clientes"
            className="flex items-center gap-3 rounded-lg bg-muted p-3 transition-colors hover:bg-muted/80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
              <Wallet className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Gestionar Clientes</p>
              <p className="text-xs text-muted-foreground">{kpis?.activeCustomers ?? 0} activos</p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
