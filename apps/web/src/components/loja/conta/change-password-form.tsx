'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/api/customer-profile';
import { getUserFacingErrorMessage } from '@/lib/errors';

export function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }
    setSaving(true);
    try {
      await changePassword(form);
      toast.success('Senha alterada com sucesso');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      setError(getUserFacingErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="pwd-current">Senha atual</Label>
        <Input
          id="pwd-current"
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
          required
          autoComplete="current-password"
          aria-describedby={error ? 'pwd-error' : undefined}
        />
      </div>
      <div>
        <Label htmlFor="pwd-new">Nova senha</Label>
        <Input
          id="pwd-new"
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="pwd-confirm">Confirmar nova senha</Label>
        <Input
          id="pwd-confirm"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          required
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p id="pwd-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-flor-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-flor-700 transition-colors disabled:opacity-60"
      >
        {saving ? 'Alterando...' : 'Alterar senha'}
      </button>
    </form>
  );
}
