'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCustomerProfile } from '@/lib/api/customer-profile';
import { useAccount } from '@/contexts/account-context';
import type { CustomerProfile } from '@flor/types';

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const { refetchProfile } = useAccount();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone ?? '');
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCustomerProfile({ name, phone: phone || undefined });
      await refetchProfile();
      toast.success('Perfil atualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="profile-name">Nome</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
        />
      </div>

      <div>
        <Label htmlFor="profile-email">E-mail</Label>
        <Input
          id="profile-email"
          type="email"
          value={profile.email}
          readOnly
          className="bg-stone-50 text-stone-500 cursor-not-allowed"
          aria-label="E-mail (somente leitura)"
        />
        <p className="mt-1 text-xs text-stone-500">
          Para alterar o e-mail, use a opção Segurança abaixo.
        </p>
      </div>

      <div>
        <Label htmlFor="profile-phone">Telefone</Label>
        <Input
          id="profile-phone"
          value={phone}
          onChange={(e) => setPhone(applyPhoneMask(e.target.value))}
          placeholder="(82) 99999-9999"
          inputMode="numeric"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-flor-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-flor-700 transition-colors disabled:opacity-60"
      >
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  );
}
