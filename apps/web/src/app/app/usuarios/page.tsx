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
import {
  type Role,
  type TenantUser,
  useInviteUser,
  useRemoveUser,
  useUpdateUserRole,
  useUsers,
} from '@/hooks/queries/use-users';
import { datetime } from '@/lib/formatters';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Crown, Plus, Shield, Trash2, User, UserCog } from 'lucide-react';
import { useState } from 'react';

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: typeof Shield }> = {
  OWNER: { label: 'Propietario', color: 'bg-amber-500/10 text-amber-500', icon: Crown },
  ADMIN: { label: 'Administrador', color: 'bg-blue-500/10 text-blue-500', icon: Shield },
  MANAGER: { label: 'Gerente', color: 'bg-emerald-500/10 text-emerald-500', icon: UserCog },
  CASHIER: { label: 'Cajero', color: 'bg-muted text-muted-foreground', icon: User },
};

function InviteForm({ onClose }: { onClose: () => void }) {
  const invite = useInviteUser();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await invite.mutateAsync({ email, role });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@email.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Rol</Label>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
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
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={invite.isPending}>
          {invite.isPending ? 'Invitando...' : 'Invitar'}
        </Button>
      </div>
    </form>
  );
}

export default function UsuariosPage() {
  const currentUserId = useAuthStore((s) => s.userId);
  const currentRole = useAuthStore((s) => s.role);
  const isOwnerOrAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const removeUser = useRemoveUser();

  const [showInvite, setShowInvite] = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState<TenantUser | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<TenantUser | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{users?.length ?? 0} miembros del equipo</p>
        </div>
        {isOwnerOrAdmin && (
          <Button onClick={() => setShowInvite(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Invitar Usuario
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
                        {user.email}
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
                    <p className="text-xs text-muted-foreground">
                      {user.createdAt ? `Desde ${datetime(user.createdAt)}` : ''}
                    </p>
                  </div>

                  {isOwnerOrAdmin && !isSelf && (
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

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
          </DialogHeader>
          <InviteForm onClose={() => setShowInvite(false)} />
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
                <span className="font-semibold text-foreground">{changeRoleUser.email}</span>
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
                    <SelectItem value="OWNER">Propietario</SelectItem>
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
              <span className="font-semibold text-foreground">{removeConfirm?.email}</span> del
              equipo?
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
