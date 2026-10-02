'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type CreatedUser,
  type Role,
  type TenantUser,
  useCreateUser,
  useInviteUser,
  useRemoveUser,
  useUpdateUserRole,
  useUsers,
} from '@/hooks/queries/use-users';
import { ApiError } from '@/lib/api';
import { datetime } from '@/lib/formatters';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Check,
  Copy,
  Crown,
  KeyRound,
  Plus,
  Shield,
  Trash2,
  User,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: typeof Shield }> = {
  OWNER: { label: 'Propietario', color: 'bg-amber-500/10 text-amber-500', icon: Crown },
  ADMIN: { label: 'Administrador', color: 'bg-blue-500/10 text-blue-500', icon: Shield },
  MANAGER: { label: 'Gerente', color: 'bg-emerald-500/10 text-emerald-500', icon: UserCog },
  CASHIER: { label: 'Cajero', color: 'bg-muted text-muted-foreground', icon: User },
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.detail;
  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}

function RoleSelect({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <div className="space-y-2">
      <Label>Rol</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Role)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CASHIER">Cajero</SelectItem>
          <SelectItem value="MANAGER">Gerente</SelectItem>
          <SelectItem value="ADMIN">Administrador</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function UserForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: CreatedUser) => void;
}) {
  const invite = useInviteUser();
  const create = useCreateUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await invite.mutateAsync({ email, role });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = await create.mutateAsync({
        name,
        email,
        role,
        password: password || undefined,
      });
      onClose();
      if (created.temporaryPassword) onCreated(created);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create">Crear</TabsTrigger>
        <TabsTrigger value="invite">Invitar</TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Nombre *</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ana Torres"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-email">Email *</Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              required
            />
          </div>
          <RoleSelect value={role} onChange={setRole} />
          <div className="space-y-2">
            <Label htmlFor="new-password">Clave</Label>
            <Input
              id="new-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Déjala vacía para generar una"
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Si la dejas vacía, el servidor genera una clave temporal que verás una sola vez.
            </p>
          </div>
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={create.isPending}>
              {create.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="invite">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email *</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Solo funciona si esa persona ya tiene una cuenta en la plataforma.
            </p>
          </div>
          <RoleSelect value={role} onChange={setRole} />
          {error && (
            <p className="flex items-start gap-1.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={invite.isPending}>
              {invite.isPending ? 'Invitando...' : 'Invitar'}
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function TemporaryPassword({ user, onClose }: { user: CreatedUser; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!user.temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(user.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible: la clave sigue visible en pantalla.
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cuenta creada para <span className="font-semibold text-foreground">{user.email}</span>.
        Envíale esta clave por un canal seguro.
      </p>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
        <code className="min-w-0 flex-1 break-all font-mono text-sm tracking-widest">
          {user.temporaryPassword}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={copy}
          aria-label="Copiar clave"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        No se volverá a mostrar. Si la pierde, restablece la clave desde la lista.
      </p>
      <Button className="w-full" onClick={onClose}>
        Entendido
      </Button>
    </div>
  );
}

export default function UsuariosPage() {
  const currentUserId = useAuthStore((s) => s.userId);
  const currentRole = useAuthStore((s) => s.role);
  const isOwner = currentRole === 'OWNER';

  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const removeUser = useRemoveUser();

  const [showInvite, setShowInvite] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<TenantUser | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<TenantUser | null>(null);

  if (!isOwner) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Solo el propietario del negocio puede gestionar los usuarios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{users?.length ?? 0} miembros del equipo</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowInvite(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Añadir Usuario
          </Button>
        )}
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !users?.length ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay usuarios</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.CASHIER;
            const RoleIcon = roleConfig.icon;
            const isSelf = user.userId === currentUserId;

            return (
              <Card key={user.userId} className="bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {user.name || user.email}
                        {isSelf && <span className="ml-1 text-xs text-muted-foreground">(tú)</span>}
                      </p>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          roleConfig.color,
                        )}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        user.name ? user.email : null,
                        user.createdAt ? `Desde ${datetime(user.createdAt)}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  {isOwner && !isSelf && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setChangeRoleUser(user)}
                      >
                        <UserCog className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setRemoveConfirm(user)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Añadir Usuario</DialogTitle>
          </DialogHeader>
          <UserForm
            onClose={() => setShowInvite(false)}
            onCreated={(user) => setCreatedUser(user)}
          />
        </DialogContent>
      </Dialog>

      {/* Temporary password dialog */}
      <Dialog open={!!createdUser} onOpenChange={(open) => !open && setCreatedUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Clave temporal
            </DialogTitle>
          </DialogHeader>
          {createdUser && (
            <TemporaryPassword user={createdUser} onClose={() => setCreatedUser(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={!!changeRoleUser} onOpenChange={() => setChangeRoleUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar Rol</DialogTitle>
          </DialogHeader>
          {changeRoleUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cambiar rol de{' '}
                <span className="font-semibold text-foreground">
                  {changeRoleUser.name ? `${changeRoleUser.name} · ` : ''}
                  {changeRoleUser.email}
                </span>
              </p>
              <div className="space-y-2">
                <Label>Nuevo rol</Label>
                <Select
                  defaultValue={changeRoleUser.role}
                  onValueChange={async (v) => {
                    await updateRole.mutateAsync({ id: changeRoleUser.userId, role: v as Role });
                    setChangeRoleUser(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASHIER">Cajero</SelectItem>
                    <SelectItem value="MANAGER">Gerente</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setChangeRoleUser(null)}>
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Eliminar a{' '}
              <span className="font-semibold text-foreground">
                {removeConfirm ? (removeConfirm.name ? `${removeConfirm.name} · ` : '') : ''}
                {removeConfirm?.email}
              </span>{' '}
              del equipo?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRemoveConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={removeUser.isPending}
                onClick={async () => {
                  if (removeConfirm) {
                    await removeUser.mutateAsync(removeConfirm.userId);
                    setRemoveConfirm(null);
                  }
                }}
              >
                {removeUser.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
