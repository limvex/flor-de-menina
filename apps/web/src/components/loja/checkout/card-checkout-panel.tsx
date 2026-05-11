'use client';

import { useEffect, useRef, useState } from 'react';
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
import { getInstallmentOptions, getMpBricksPublicKey } from '@/lib/api/payments';

export interface CardTokenPayload {
  cardToken: string;
  paymentMethodId: string;
  installments: number;
}

interface Props {
  total: number;
  payerEmail?: string | null;
  /** Quando o MP (ou mock) conclui o token — aqui roda createOrder + charge; não use só para setState. */
  onCardSubmit: (payload: CardTokenPayload) => Promise<void>;
  isSubmitting?: boolean;
}

/** Mock só com `NEXT_PUBLIC_MOCK_PAYMENT=true`. Caso contrário, exige chave pública do MP. */
const useMockCardUi = process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true';

export function CardCheckoutPanel({
  total,
  payerEmail,
  onCardSubmit,
  isSubmitting = false,
}: Props) {
  const [mockInstallments, setMockInstallments] = useState(1);
  const [mockProfile, setMockProfile] = useState<'visa_ok' | 'master_ok' | 'visa_fail'>('visa_ok');
  /** `null` = ainda resolvendo (env ou GET /payments/sdk-config). */
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);
  const brickWrapRef = useRef<HTMLDivElement>(null);

  const { data: installmentRows } = useQuery({
    queryKey: ['payment-installments', total],
    queryFn: () => getInstallmentOptions(total),
    enabled: useMockCardUi && total > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (useMockCardUi) return;

    let cancelled = false;

    const fromEnv = (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '').trim();
    if (fromEnv) {
      setMpPublicKey(fromEnv);
      initMercadoPago(fromEnv, { locale: 'pt-BR' });
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const fromApi = await getMpBricksPublicKey();
        if (cancelled) return;
        if (fromApi) {
          setMpPublicKey(fromApi);
          initMercadoPago(fromApi, { locale: 'pt-BR' });
        } else {
          setMpPublicKey('');
        }
      } catch {
        if (!cancelled) setMpPublicKey('');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!useMockCardUi && mpPublicKey === null) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 py-8 text-sm text-stone-600">
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
        Carregando formulário de pagamento…
      </div>
    );
  }

  if (!useMockCardUi && !mpPublicKey) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-medium">Cartão indisponível neste ambiente</p>
        <p className="mt-2 text-xs leading-relaxed">
          Defina a chave pública de <strong>teste</strong> do Mercado Pago no{' '}
          <code className="rounded bg-red-100 px-1 font-mono text-[11px]">.env na raiz</code> como{' '}
          <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[11px]">
            MP_PUBLIC_KEY
          </code>{' '}
          ou{' '}
          <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[11px]">
            NEXT_PUBLIC_MP_PUBLIC_KEY
          </code>{' '}
          (a API expõe em{' '}
          <code className="rounded bg-red-100 px-1 font-mono text-[11px]">
            GET /payments/sdk-config
          </code>
          ). Reinicie a API e o{' '}
          <code className="rounded bg-red-100 px-1 font-mono text-[11px]">
            pnpm --filter @flor/web dev
          </code>
          . Na API use{' '}
          <code className="rounded bg-red-100 px-1 font-mono text-[11px]">
            PAYMENT_PROVIDER=mercado_pago
          </code>{' '}
          e <code className="rounded bg-red-100 px-1 font-mono text-[11px]">MP_ACCESS_TOKEN</code>{' '}
          de teste.
        </p>
      </div>
    );
  }

  if (useMockCardUi) {
    const rows = installmentRows ?? [];
    const maxFromApi = rows.length > 0 ? Math.max(...rows.map((r) => r.installments)) : 5;
    const maxInst = Math.min(maxFromApi, 5);

    const mockToken =
      mockProfile === 'master_ok'
        ? 'mock_tok_mastercard_5454'
        : mockProfile === 'visa_fail'
          ? 'mock_tok_visa_0001'
          : 'mock_tok_visa_4242';

    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Modo cartão simulado (
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_MOCK_PAYMENT=true</code>
          ). Para usar o formulário real do Mercado Pago, remova essa variável e configure a chave
          pública de teste.
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
              <SelectItem value="visa_ok">Visa 4242 — mock aprova sempre</SelectItem>
              <SelectItem value="master_ok">Mastercard 5454 — mock aprova sempre</SelectItem>
              <SelectItem value="visa_fail">Visa 0001 — mock recusa sempre</SelectItem>
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
          disabled={isSubmitting}
          onClick={() =>
            onCardSubmit({
              cardToken: mockToken,
              paymentMethodId: mockProfile.startsWith('master') ? 'master' : 'visa',
              installments: mockInstallments,
            })
          }
        >
          {isSubmitting ? 'Processando…' : 'Simular pagamento com cartão'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-600">
        Preencha os dados e use o botão <strong className="text-stone-800">Pagar</strong> do Mercado
        Pago abaixo. O pedido é criado e cobrado nesta etapa — você será redirecionado para o
        resultado.
      </p>

      <div ref={brickWrapRef} className="relative min-w-0 max-w-xl">
        {isSubmitting && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-[1px]"
            aria-busy
            aria-label="Processando pagamento"
          >
            <span className="inline-block size-8 animate-spin rounded-full border-2 border-stone-300 border-t-[#5c4033]" />
          </div>
        )}
        <CardPayment
          locale="pt-BR"
          initialization={{
            amount: Number(total.toFixed(2)),
            payer: payerEmail ? { email: payerEmail } : undefined,
          }}
          customization={{
            paymentMethods: { maxInstallments: 5, minInstallments: 1 },
          }}
          onSubmit={async (formData) => {
            await onCardSubmit({
              cardToken: formData.token,
              paymentMethodId: formData.payment_method_id,
              installments: formData.installments,
            });
          }}
        />
      </div>
    </div>
  );
}
