'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getInstallmentOptions } from '@/lib/api/payments';

export interface CardTokenPayload {
  cardToken: string;
  paymentMethodId: string;
  installments: number;
}

interface Props {
  total: number;
  payerEmail?: string | null;
  onCardReady: (payload: CardTokenPayload) => void;
}

const isMockMode =
  process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true' || !process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

export function CardCheckoutPanel({ total, payerEmail, onCardReady }: Props) {
  const [mockInstallments, setMockInstallments] = useState(1);
  const [mockProfile, setMockProfile] = useState<'visa_ok' | 'master_ok' | 'visa_fail'>('visa_ok');

  const { data: installmentRows } = useQuery({
    queryKey: ['payment-installments', total],
    queryFn: () => getInstallmentOptions(total),
    enabled: isMockMode && total > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isMockMode) return;
    const pk = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (!pk) return;
    initMercadoPago(pk, { locale: 'pt-BR' });
  }, []);

  if (isMockMode) {
    const rows = installmentRows ?? [];
    const maxInst = rows.length > 0 ? Math.max(...rows.map((r) => r.installments)) : 12;

    const mockToken =
      mockProfile === 'master_ok'
        ? 'mock_tok_mastercard_5454'
        : mockProfile === 'visa_fail'
          ? 'mock_tok_visa_0001'
          : 'mock_tok_visa_4242';

    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Modo de desenvolvimento: nenhum dado de cartão real é enviado. O backend usa o mock do
          Mercado Pago. Em produção, use chave pública TEST/PROD e{' '}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_MOCK_PAYMENT=false</code>.
        </p>

        <div className="space-y-1.5">
          <Label>Perfil de teste</Label>
          <Select
            value={mockProfile}
            onValueChange={(v) => setMockProfile(v as typeof mockProfile)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visa_ok">Visa 4242 (costuma aprovar ~80%)</SelectItem>
              <SelectItem value="master_ok">Mastercard 5454 (costuma aprovar ~80%)</SelectItem>
              <SelectItem value="visa_fail">Visa 0001 (costuma recusar)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Parcelas</Label>
          <Select
            value={String(mockInstallments)}
            onValueChange={(v) => v && setMockInstallments(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: maxInst }, (_, i) => {
                const n = i + 1;
                const row = rows.find((r) => r.installments === n);
                const label = row
                  ? `${n}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.installmentAmount)}${row.hasInterest ? ' (com juros)' : ''}`
                  : `${n}x`;
                return (
                  <SelectItem key={n} value={String(n)}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-flor-300"
          onClick={() =>
            onCardReady({
              cardToken: mockToken,
              paymentMethodId: mockProfile.startsWith('master') ? 'master' : 'visa',
              installments: mockInstallments,
            })
          }
        >
          Simular token e continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CardPayment
        locale="pt-BR"
        initialization={{
          amount: Number(total.toFixed(2)),
          payer: payerEmail ? { email: payerEmail } : undefined,
        }}
        customization={{
          paymentMethods: { maxInstallments: 12, minInstallments: 1 },
        }}
        onSubmit={async (formData) => {
          onCardReady({
            cardToken: formData.token,
            paymentMethodId: formData.payment_method_id,
            installments: formData.installments,
          });
        }}
      />
    </div>
  );
}
