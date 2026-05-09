'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  installments: number;
}

interface Props {
  total: number;
  onChange: (data: CardData | null) => void;
}

function maskCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function maskExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function luhn(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function CardForm({ total, onChange }: Props) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  const notify = (overrides: Partial<CardData> = {}) => {
    const data: CardData = {
      number,
      name,
      expiry,
      cvv,
      installments,
      ...overrides,
    };
    const digits = data.number.replace(/\D/g, '');
    const parts = data.expiry.split('/');
    const mm = parts[0] ?? '';
    const yy = parts[1] ?? '';
    const expiryValid = mm && yy && parseInt(mm) >= 1 && parseInt(mm) <= 12 && yy.length === 2;
    const valid =
      digits.length === 16 &&
      luhn(digits) &&
      data.name.trim().length >= 3 &&
      expiryValid &&
      data.cvv.length >= 3;
    onChange(valid ? data : null);
  };

  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return {
      value: n,
      label: `${n}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total / n)} (sem juros)`,
    };
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="card-number">Número do cartão</Label>
        <Input
          id="card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={number}
          maxLength={19}
          onChange={(e) => {
            const masked = maskCardNumber(e.target.value);
            setNumber(masked);
            notify({ number: masked });
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="card-name">Nome no cartão</Label>
        <Input
          id="card-name"
          autoComplete="cc-name"
          placeholder="Como aparece no cartão"
          value={name}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setName(v);
            notify({ name: v });
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-expiry">Validade</Label>
          <Input
            id="card-expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={expiry}
            maxLength={5}
            onChange={(e) => {
              const masked = maskExpiry(e.target.value);
              setExpiry(masked);
              notify({ expiry: masked });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-cvv">CVV</Label>
          <Input
            id="card-cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="000"
            value={cvv}
            maxLength={4}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              setCvv(v);
              notify({ cvv: v });
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="card-installments">Parcelas</Label>
        <Select
          value={String(installments)}
          onValueChange={(v) => {
            if (!v) return;
            const n = parseInt(v);
            setInstallments(n);
            notify({ installments: n });
          }}
        >
          <SelectTrigger id="card-installments" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-max">
            {installmentOptions.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
