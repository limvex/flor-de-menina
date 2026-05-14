'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
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

interface CreateAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: AdminUserListItem) => void;
}

type FormValues = {
  name: string;
  email: string;
  temporaryPassword: string;
};

function PasswordSuccess({ password, onClose }: { password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Anote a senha temporária agora</p>
        <p>Ela não será exibida novamente. O admin deverá alterá-la no primeiro acesso.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Senha temporária</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              readOnly
              type={show ? 'text' : 'password'}
              value={password}
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-flor-400 hover:text-flor-600"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Fechar</Button>
      </DialogFooter>
    </div>
  );
}

export function CreateAdminModal({ open, onOpenChange, onCreated }: CreateAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: '', email: '', temporaryPassword: '' },
  });

  function handleClose() {
    reset();
    setCreatedPassword(null);
    onOpenChange(false);
  }

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const created = await adminUsersApi.create({
        name: data.name,
        email: data.email.toLowerCase().trim(),
        temporaryPassword: data.temporaryPassword,
      });
      onCreated(created);
      setCreatedPassword(data.temporaryPassword);
      reset();
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {createdPassword ? 'Admin criado com sucesso' : 'Novo administrador'}
          </DialogTitle>
        </DialogHeader>

        {createdPassword ? (
          <PasswordSuccess password={createdPassword} onClose={handleClose} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Nome</Label>
              <Input
                id="admin-name"
                autoComplete="off"
                {...register('name', { required: 'Obrigatório' })}
                className={errors.name ? 'border-red-400' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email">E-mail</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="off"
                {...register('email', { required: 'Obrigatório' })}
                className={errors.email ? 'border-red-400' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-pw">Senha temporária</Label>
              <div className="relative">
                <Input
                  id="admin-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('temporaryPassword', {
                    required: 'Obrigatório',
                    minLength: { value: 8, message: 'Mínimo de 8 caracteres' },
                  })}
                  className={errors.temporaryPassword ? 'border-red-400 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-flor-400 hover:text-flor-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.temporaryPassword && (
                <p className="text-xs text-red-500">{errors.temporaryPassword.message}</p>
              )}
              <p className="text-xs text-flor-400">
                O admin será obrigado a trocar a senha no primeiro acesso.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar administrador'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
