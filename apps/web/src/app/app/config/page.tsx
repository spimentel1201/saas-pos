'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type Branch,
  type Tax,
  useBranches,
  useCreateBranch,
  useCreateTax,
  useDeleteBranch,
  useDeleteTax,
  useSettings,
  useTaxes,
  useUpdateBranch,
  useUpdateSettings,
  useUpdateTax,
  useUpdateTicketHeader,
} from '@/hooks/queries/use-config';
import { Building2, Edit, MapPin, Plus, Receipt, Trash2 } from 'lucide-react';
import { useState } from 'react';

function BranchForm({ branch, onClose }: { branch?: Branch; onClose: () => void }) {
  const create = useCreateBranch();
  const update = useUpdateBranch();
  const isEdit = !!branch;

  const [name, setName] = useState(branch?.name ?? '');
  const [code, setCode] = useState(branch?.code ?? '');
  const [address, setAddress] = useState(branch?.address ?? '');
  const [city, setCity] = useState(branch?.city ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      await update.mutateAsync({
        id: branch.id,
        data: { name, address: address || undefined, city: city || undefined },
      });
    } else {
      await create.mutateAsync({
        name,
        code,
        address: address || undefined,
        city: city || undefined,
      });
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
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="code">Codigo *</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CEN01"
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="address">Direccion</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Ciudad</Label>
        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

function TaxForm({ tax, onClose }: { tax?: Tax; onClose: () => void }) {
  const create = useCreateTax();
  const update = useUpdateTax();
  const isEdit = !!tax;

  const [name, setName] = useState(tax?.name ?? '');
  const [rate, setRate] = useState(tax?.rate?.toString() ?? '0.18');
  const [type, setType] = useState<'PERCENT' | 'EXEMPT' | 'FIXED'>(tax?.type ?? 'PERCENT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = Number.parseFloat(rate);
    if (isEdit) {
      await update.mutateAsync({ id: tax.id, data: { name, rate: rateNum } });
    } else {
      await create.mutateAsync({ name, rate: rateNum, type });
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tax-name">Nombre *</Label>
        <Input
          id="tax-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="IGV 18%"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tax-rate">Tasa *</Label>
          <Input
            id="tax-rate"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
          />
          <p className="text-[10px] text-muted-foreground">0.18 = 18%</p>
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as 'PERCENT' | 'EXEMPT' | 'FIXED')}
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Porcentaje</SelectItem>
              <SelectItem value="EXEMPT">Exento</SelectItem>
              <SelectItem value="FIXED">Fijo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

function SettingsTab() {
  const { data: settings } = useSettings();
  const updateTicket = useUpdateTicketHeader();
  const updateSettings = useUpdateSettings();

  const getSetting = (key: string) => settings?.find((s) => s.key === key);

  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ticketWidth, setTicketWidth] = useState('58mm');
  const [loaded, setLoaded] = useState(false);

  if (settings && !loaded) {
    const th = getSetting('ticket_header');
    const headerVal = (th?.value ?? {}) as Record<string, string>;
    if (headerVal.businessName) setBusinessName(headerVal.businessName);
    if (headerVal.address) setAddress(headerVal.address);
    if (headerVal.phone) setPhone(headerVal.phone);
    if (headerVal.logoUrl) setLogoUrl(headerVal.logoUrl);
    const tw = getSetting('ticket_width');
    if (tw) setTicketWidth(tw.value as string);
    setLoaded(true);
  }

  const handleSave = async () => {
    await updateTicket.mutateAsync({
      businessName,
      address,
      phone,
      logoUrl,
    });
    await updateSettings.mutateAsync({ ticket_width: ticketWidth });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Datos del Negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Razon Social</Label>
            <Input
              id="biz-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-address">Direccion</Label>
            <Input id="biz-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-phone">Telefono</Label>
            <Input id="biz-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-logo">Logo URL</Label>
            <Input
              id="biz-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Ancho del Ticket</Label>
            <Select value={ticketWidth} onValueChange={setTicketWidth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm (estandar POS)</SelectItem>
                <SelectItem value="80mm">80mm (amplio)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              58mm: impresoras termicas estandar. 80mm: mas legible, mas espacio.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateTicket.isPending || updateSettings.isPending}
          >
            {updateTicket.isPending || updateSettings.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfigPage() {
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null);

  const [showTaxForm, setShowTaxForm] = useState(false);
  const [editTax, setEditTax] = useState<Tax | null>(null);
  const [deleteTax, setDeleteTax] = useState<Tax | null>(null);

  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: taxes, isLoading: taxesLoading } = useTaxes();
  const deleteBranchMut = useDeleteBranch();
  const deleteTaxMut = useDeleteTax();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuracion</h1>
        <p className="text-sm text-muted-foreground">Sucursales, impuestos y datos del negocio</p>
      </div>

      <Tabs defaultValue="branches">
        <TabsList>
          <TabsTrigger value="branches">
            <Building2 className="mr-1 h-3 w-3" />
            Sucursales
          </TabsTrigger>
          <TabsTrigger value="taxes">
            <Receipt className="mr-1 h-3 w-3" />
            Impuestos
          </TabsTrigger>
          <TabsTrigger value="settings">Datos del Negocio</TabsTrigger>
        </TabsList>

        {/* Branches */}
        <TabsContent value="branches" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowBranchForm(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nueva Sucursal
            </Button>
          </div>

          {branchesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !branches?.length ? (
            <Card className="bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No hay sucursales</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {branches.map((branch) => (
                <Card key={branch.id} className="bg-card">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{branch.name}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {branch.code}
                        </Badge>
                        {!branch.active && (
                          <Badge variant="destructive" className="text-[10px]">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {branch.city && <span>{branch.city}</span>}
                        {branch.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {branch.address}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditBranch(branch)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteBranch(branch)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Taxes */}
        <TabsContent value="taxes" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowTaxForm(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo Impuesto
            </Button>
          </div>

          {taxesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !taxes?.length ? (
            <Card className="bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No hay impuestos configurados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {taxes.map((tax) => (
                <Card key={tax.id} className="bg-card">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{tax.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tax.type === 'PERCENT'
                          ? `${(tax.rate * 100).toFixed(1)}%`
                          : tax.type === 'EXEMPT'
                            ? 'Exento'
                            : `S/. ${tax.rate}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditTax(tax)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTax(tax)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>

      {/* Branch dialogs */}
      <Dialog open={showBranchForm} onOpenChange={setShowBranchForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Sucursal</DialogTitle>
          </DialogHeader>
          <BranchForm onClose={() => setShowBranchForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editBranch} onOpenChange={() => setEditBranch(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sucursal</DialogTitle>
          </DialogHeader>
          {editBranch && <BranchForm branch={editBranch} onClose={() => setEditBranch(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteBranch} onOpenChange={() => setDeleteBranch(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Sucursal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Eliminar <span className="font-semibold text-foreground">{deleteBranch?.name}</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteBranch(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteBranchMut.isPending}
                onClick={async () => {
                  if (deleteBranch) {
                    await deleteBranchMut.mutateAsync(deleteBranch.id);
                    setDeleteBranch(null);
                  }
                }}
              >
                {deleteBranchMut.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tax dialogs */}
      <Dialog open={showTaxForm} onOpenChange={setShowTaxForm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo Impuesto</DialogTitle>
          </DialogHeader>
          <TaxForm onClose={() => setShowTaxForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editTax} onOpenChange={() => setEditTax(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Impuesto</DialogTitle>
          </DialogHeader>
          {editTax && <TaxForm tax={editTax} onClose={() => setEditTax(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteTax} onOpenChange={() => setDeleteTax(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Impuesto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Eliminar <span className="font-semibold text-foreground">{deleteTax?.name}</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTax(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteTaxMut.isPending}
                onClick={async () => {
                  if (deleteTax) {
                    await deleteTaxMut.mutateAsync(deleteTax.id);
                    setDeleteTax(null);
                  }
                }}
              >
                {deleteTaxMut.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
