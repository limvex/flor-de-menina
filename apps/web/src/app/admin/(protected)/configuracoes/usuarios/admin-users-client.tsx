'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateAdminModal } from '@/components/admin/users/create-admin-modal';
import { EditAdminModal } from '@/components/admin/users/edit-admin-modal';
import { adminUsersApi } from '@/lib/api/admin-users';
import { getUserFacingErrorMessage } from '@/lib/errors';
import type { AdminUserListItem } from '@flor/types';

interface AdminUsersClientProps {
  initialAdmins: AdminUserListItem[];
  currentUserId: string;
}

export function AdminUsersClient({ initialAdmins, currentUserId }: AdminUsersClientProps) {
  const [admins, setAdmins] = useState<AdminUserListItem[]>(initialAdmins);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserListItem | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  function handleCreated(user: AdminUserListItem) {
    setAdmins((prev) => [...prev, user]);
    toast.success(`Admin ${user.name} criado com sucesso`);
  }

  function handleUpdated(user: AdminUserListItem) {
    setAdmins((prev) => prev.map((a) => (a.id === user.id ? user : a)));
  }

  async function handleRemove(admin: AdminUserListItem) {
    if (admin.id === currentUserId) {
      toast.error('Você não pode desativar sua própria conta');
      return;
    }
    const confirmed = window.confirm(
      `Desativar o acesso de "${admin.name}"? Esta ação pode ser revertida pelo banco de dados.`,
    );
    if (!confirmed) return;

    setRemoving(admin.id);
    try {
      await adminUsersApi.remove(admin.id);
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, isActive: false } : a)));
      toast.success(`Acesso de ${admin.name} desativado`);
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo administrador
        </Button>
      </div>

      <div className="rounded-xl border border-flor-100 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-flor-100 bg-flor-50 text-left text-xs font-medium text-flor-500 uppercase tracking-wide">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3 hidden sm:table-cell">E-mail</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-flor-50">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-flor-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-flor-800">{admin.name}</p>
                    <p className="text-xs text-flor-400 sm:hidden">{admin.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-flor-600">{admin.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {admin.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-green-200 text-green-700 bg-green-50 w-fit gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-red-200 text-red-700 bg-red-50 w-fit gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Inativo
                      </Badge>
                    )}
                    {admin.mustChangePassword && (
                      <Badge
                        variant="outline"
                        className="border-amber-200 text-amber-700 bg-amber-50 w-fit text-xs"
                      >
                        Senha temporária
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditTarget(admin)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {admin.isActive && admin.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemove(admin)}
                        disabled={removing === admin.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Desativar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-flor-400">
                  Nenhum administrador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateAdminModal open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      <EditAdminModal
        open={editTarget !== null}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
        admin={editTarget}
        onUpdated={handleUpdated}
      />
    </>
  );
}
