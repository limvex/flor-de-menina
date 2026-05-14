'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminUsersApi } from '@/lib/api/admin-users';
import { getUserFacingErrorMessage } from '@/lib/errors';
import type { AdminUserListItem } from '@flor/types';

interface EditAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminUserListItem | null;
  onUpdated: (user: AdminUserListItem) => void;
}

type FormValues = {
  name: string;
};

export function EditAdminModal({ open, onOpenChange, admin, onUpdated }: EditAdminModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { name: '' } });

  useEffect(() => {
    if (admin) reset({ name: admin.name });
  }, [admin, reset]);

  async function onSubmit(data: FormValues) {
    if (!admin) return;
    setLoading(true);
    try {
      const updated = await adminUsersApi.update(admin.id, { name: data.name });
      toast.success('Administrador atualizado');
      onUpdated(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar administrador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              {...register('name', { required: 'Obrigatório' })}
              className={errors.name ? 'border-red-400' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={admin?.email ?? ''} readOnly disabled className="bg-flor-50" />
            <p className="text-xs text-flor-400">O e-mail não pode ser alterado.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
