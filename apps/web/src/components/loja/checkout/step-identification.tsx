'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-context';
import { useCheckout } from '@/contexts/checkout-context';

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(digits[10]);
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

interface UserWithCpf {
  id: string;
  email: string;
  name: string;
  cpf?: string | null;
  phone?: string | null;
}

interface Props {
  userProfile?: UserWithCpf | null;
}

export function StepIdentification({ userProfile }: Props) {
  const { user } = useAuth();
  const { state, setIdentification } = useCheckout();

  const saved = state.identification;

  const [name, setName] = useState(saved?.name ?? userProfile?.name ?? user?.name ?? '');
  const [cpf, setCpf] = useState(saved?.cpf ?? (userProfile?.cpf ? maskCpf(userProfile.cpf) : ''));
  const [phone, setPhone] = useState(
    saved?.phone ?? (userProfile?.phone ? maskPhone(userProfile.phone) : ''),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'Nome obrigatório';
    if (!validateCpf(cpf)) errs.cpf = 'CPF inválido';
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) errs.phone = 'Telefone inválido';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIdentification({
      name: name.trim(),
      email: user?.email ?? '',
      cpf,
      phone,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <h2 className="font-serif text-xl font-normal text-flor-800">Identificação</h2>

      <div className="space-y-1.5">
        <Label htmlFor="ident-email">E-mail</Label>
        <Input
          id="ident-email"
          type="email"
          value={user?.email ? maskEmail(user.email) : ''}
          readOnly
          disabled
          className="bg-flor-50 text-flor-500"
        />
        <p className="text-xs text-flor-400">Associado à sua conta</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ident-name">Nome completo</Label>
        <Input
          id="ident-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((p) => ({ ...p, name: '' }));
          }}
          placeholder="Seu nome"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-red-500">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ident-cpf">CPF</Label>
        <Input
          id="ident-cpf"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => {
            setCpf(maskCpf(e.target.value));
            setErrors((p) => ({ ...p, cpf: '' }));
          }}
          placeholder="000.000.000-00"
          maxLength={14}
          aria-invalid={!!errors.cpf}
          aria-describedby={errors.cpf ? 'cpf-error' : undefined}
        />
        {errors.cpf && (
          <p id="cpf-error" role="alert" className="text-xs text-red-500">
            {errors.cpf}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ident-phone">Telefone / WhatsApp</Label>
        <Input
          id="ident-phone"
          inputMode="tel"
          value={phone}
          onChange={(e) => {
            setPhone(maskPhone(e.target.value));
            setErrors((p) => ({ ...p, phone: '' }));
          }}
          placeholder="(00) 00000-0000"
          maxLength={15}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
        />
        {errors.phone && (
          <p id="phone-error" role="alert" className="text-xs text-red-500">
            {errors.phone}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full bg-flor-800 hover:bg-flor-700 text-white">
        Continuar
      </Button>
    </form>
  );
}
