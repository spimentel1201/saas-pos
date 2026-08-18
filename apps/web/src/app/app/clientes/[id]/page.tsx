'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  type CustomerType,
  useCustomer,
  useCustomerPurchases,
} from '@/hooks/queries/use-customers';
import { date, formatPEN } from '@/lib/formatters';
import { ArrowLeft, DollarSign, FileText, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const TYPE_LABELS: Record<CustomerType, { label: string; color: string }> = {
  INDIVIDUAL: { label: 'Persona', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  BUSINESS: { label: 'Empresa', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { data: customer, isLoading } = useCustomer(customerId);
  const { data: purchasesData } = useCustomerPurchases(customerId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-muted-foreground">Cliente no encontrado</p>
        <Button variant="link" onClick={() => router.push('/app/clientes')}>
          Volver a clientes
        </Button>
      </div>
    );
  }

  const type = TYPE_LABELS[customer.type];
  const purchases =
    (
      purchasesData as {
        data?: Array<{
          saleId: string;
          numberSeq?: number;
          total: number;
          createdAt: string;
          status?: string;
        }>;
      }
    )?.data ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/clientes"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">Cliente desde {date(customer.createdAt)}</p>
        </div>
        <Badge variant="secondary" className={type.color}>
          {type.label}
        </Badge>
        {!customer.active && (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400">
            Inactivo
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {customer.documentType && customer.documentNumber && (
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{customer.documentType}</p>
                    <p className="font-mono text-sm">{customer.documentNumber}</p>
                  </div>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefono</p>
                    <p className="text-sm">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Direccion</p>
                    <p className="text-sm">{customer.address}</p>
                  </div>
                </div>
              )}
            </div>
            {customer.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Credit balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldo de credito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{formatPEN(customer.creditBalance)}</p>
                <p className="text-xs text-muted-foreground">Disponible para compras a credito</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de compras</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Este cliente no tiene compras registradas
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Venta</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 text-right font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((sale) => (
                    <tr key={sale.saleId} className="border-b border-border/50">
                      <td className="py-2.5">
                        <Link
                          href={`/app/ventas/${sale.saleId}`}
                          className="font-mono text-primary hover:underline"
                        >
                          #{sale.numberSeq}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium">
                        {formatPEN(sale.total)}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="secondary"
                          className={
                            sale.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }
                        >
                          {sale.status === 'COMPLETED' ? 'Completada' : 'Anulada'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {date(sale.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
