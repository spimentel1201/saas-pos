'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  type Customer,
  type CustomerType,
  type DocumentType,
  useAdjustCredit,
  useCreateCustomer,
  useCustomers,
  useDeactivateCustomer,
  useUpdateCustomer,
} from '@/hooks/queries/use-customers';
import { formatPEN } from '@/lib/formatters';
import {
  Edit,
  FileText,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  DNI: 'DNI',
  RUC: 'RUC',
  CE: 'CE',
  PASSPORT: 'Pasaporte',
};

const TYPE_LABELS: Record<CustomerType, string> = {
  INDIVIDUAL: 'Persona Natural',
  BUSINESS: 'Empresa',
};

function CustomerForm({
  customer,
  onClose,
}: {
  customer?: Customer;
  onClose: () => void;
}) {
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const isEdit = !!customer;

  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [type, setType] = useState<CustomerType>(customer?.type ?? 'INDIVIDUAL');
  const [documentType, setDocumentType] = useState<DocumentType | ''>(customer?.documentType ?? '');
  const [documentNumber, setDocumentNumber] = useState(customer?.documentNumber ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      type,
      documentType: (documentType || undefined) as DocumentType | undefined,
      documentNumber: documentNumber || undefined,
      address: address || undefined,
      notes: notes || undefined,
    };

    if (isEdit) {
      await update.mutateAsync({ id: customer.id, data });
    } else {
      await create.mutateAsync(data);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9XXXXXXXX"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as CustomerType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL">Persona Natural</SelectItem>
              <SelectItem value="BUSINESS">Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Documento</Label>
          <Select
            value={documentType}
            onValueChange={(v) => setDocumentType(v as DocumentType | '')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DNI">DNI</SelectItem>
              <SelectItem value="RUC">RUC</SelectItem>
              <SelectItem value="CE">CE</SelectItem>
              <SelectItem value="PASSPORT">Pasaporte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {documentType && (
        <div className="space-y-2">
          <Label htmlFor="docNumber">
            Número de {DOC_TYPE_LABELS[documentType as DocumentType] ?? 'Documento'}
          </Label>
          <Input
            id="docNumber"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder={
              documentType === 'DNI' ? '8 dígitos' : documentType === 'RUC' ? '11 dígitos' : ''
            }
            maxLength={documentType === 'DNI' ? 8 : documentType === 'RUC' ? 11 : 20}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Cliente'}
        </Button>
      </div>
    </form>
  );
}

function CreditAdjustDialog({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const adjust = useAdjustCredit();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleAdjust = async () => {
    const value = Number.parseFloat(amount);
    if (Number.isNaN(value) || value === 0) return;
    await adjust.mutateAsync({ id: customer.id, amount: value, reason: reason || undefined });
    onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Saldo actual:{' '}
        <span className="font-semibold text-foreground">{formatPEN(customer.creditBalance)}</span>
      </p>
      <div className="space-y-2">
        <Label htmlFor="credit-amount">Monto (+ sumar, - restar)</Label>
        <Input
          id="credit-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50.00 o -20.00"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="credit-reason">Motivo (opcional)</Label>
        <Input id="credit-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="flex-1" disabled={adjust.isPending || !amount} onClick={handleAdjust}>
          {adjust.isPending ? 'Ajustando...' : 'Ajustar'}
        </Button>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [creditCustomer, setCreditCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  const deactivate = useDeactivateCustomer();

  const { data, isLoading } = useCustomers({
    search: search || undefined,
    type: (typeFilter as CustomerType) || undefined,
    limit: 50,
  });

  const customers = data?.data ?? [];

  const stats = useMemo(() => {
    const active = customers.filter((c) => c.active).length;
    const totalCredit = customers.reduce((sum, c) => sum + c.creditBalance, 0);
    return { active, total: customers.length, totalCredit };
  }, [customers]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} registros · {formatPEN(stats.totalCredit)} en créditos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, DNI, RUC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CustomerType | '')}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="INDIVIDUAL">Persona Natural</SelectItem>
            <SelectItem value="BUSINESS">Empresa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay clientes registrados</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Crear primer cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Card key={customer.id} className="bg-card transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/app/clientes/${customer.id}`}
                      className="truncate text-sm font-medium hover:text-primary hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <Badge
                      variant={customer.type === 'BUSINESS' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {TYPE_LABELS[customer.type]}
                    </Badge>
                    {!customer.active && (
                      <Badge variant="destructive" className="text-[10px]">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {customer.documentType && customer.documentNumber && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {customer.documentType}: {customer.documentNumber}
                      </span>
                    )}
                    {customer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                    )}
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  {customer.creditBalance > 0 && (
                    <Badge variant="outline" className="text-emerald-500">
                      {formatPEN(customer.creditBalance)}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCreditCustomer(customer)}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditCustomer(customer)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteConfirm(customer)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editCustomer && (
            <CustomerForm customer={editCustomer} onClose={() => setEditCustomer(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Credit adjust dialog */}
      <Dialog open={!!creditCustomer} onOpenChange={() => setCreditCustomer(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustar Crédito</DialogTitle>
          </DialogHeader>
          {creditCustomer && (
            <CreditAdjustDialog customer={creditCustomer} onClose={() => setCreditCustomer(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Desactivar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Desactivar a{' '}
              <span className="font-semibold text-foreground">{deleteConfirm?.name}</span>? No podrá
              usarlo en ventas.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deactivate.isPending}
                onClick={async () => {
                  if (deleteConfirm) {
                    await deactivate.mutateAsync(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }
                }}
              >
                {deactivate.isPending ? 'Desactivando...' : 'Desactivar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
