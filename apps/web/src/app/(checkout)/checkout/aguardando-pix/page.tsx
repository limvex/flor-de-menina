'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { CheckoutHeader } from '@/components/loja/checkout/checkout-header';
import { CheckoutFooter } from '@/components/loja/checkout/checkout-footer';
import { PixDisplay } from '@/components/loja/checkout/pix-display';
import { getOrder } from '@/lib/api/orders';
import { getPaymentStatus } from '@/lib/api/payments';
import type { OrderResponse } from '@flor/types';

type PixBundle = {
  qrCodeBase64: string;
  copyPaste: string;
  expiresAtIso: string;
};

function pickPixFromOrder(order: OrderResponse): PixBundle | null {
  const p = order.payment;
  if (!p?.qrCodeBase64 || !p.pixCopyPaste || !p.pixExpiresAt) return null;
  return {
    qrCodeBase64: p.qrCodeBase64,
    copyPaste: p.pixCopyPaste,
    expiresAtIso: p.pixExpiresAt,
  };
}

function AguardandoPixContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const orderId = search.get('orderId');
  const paymentId = search.get('paymentId');

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pixOverride, setPixOverride] = useState<PixBundle | null>(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const pixFilledRef = useRef(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const o = await getOrder(orderId);
      setOrder(o);
      setLoadError(null);
    } catch {
      setLoadError('Não foi possível carregar o pedido.');
    }
  }, [orderId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (orderId && paymentId) {
        const dest = `/checkout/aguardando-pix?orderId=${encodeURIComponent(orderId)}&paymentId=${encodeURIComponent(paymentId)}`;
        router.replace(`/login?redirect=${encodeURIComponent(dest)}`);
      } else {
        router.replace('/login?redirect=/checkout');
      }
      return;
    }
    if (!orderId || !paymentId) {
      setLoadError('Link inválido.');
      return;
    }
    void loadOrder();
  }, [authLoading, user, router, orderId, paymentId, loadOrder]);

  useEffect(() => {
    if (!paymentId || !orderId || !user) return;

    const tick = async () => {
      setPollAttempts((n) => n + 1);
      try {
        const st = await getPaymentStatus(paymentId);
        if (st.status === 'APPROVED') {
          router.replace(`/pedido/confirmacao/${orderId}`);
          return;
        }
        if (st.status === 'REJECTED' || st.status === 'CANCELLED' || st.status === 'REFUNDED') {
          toast.error('Pagamento não concluído.');
          router.replace(`/conta/pedidos/${orderId}`);
          return;
        }
        if (!pixFilledRef.current && st.pix?.qrCodeBase64 && st.pix.copyPaste && st.pix.expiresAt) {
          pixFilledRef.current = true;
          setPixOverride({
            qrCodeBase64: st.pix.qrCodeBase64,
            copyPaste: st.pix.copyPaste,
            expiresAtIso: st.pix.expiresAt,
          });
        }
        await loadOrder();
      } catch {
        // mantém UI; próximo poll tenta de novo
      }
    };

    const id = setInterval(() => void tick(), 3500);
    void tick();
    return () => clearInterval(id);
  }, [paymentId, orderId, user, router, loadOrder]);

  if (authLoading || (!order && !loadError)) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-flor-600" aria-label="Carregando" />
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-flor-600">
        <p>{loadError ?? 'Pedido não encontrado.'}</p>
      </div>
    );
  }

  const pix = pixOverride ?? pickPixFromOrder(order);
  const showPixTimeoutHelp = !pix && pollAttempts >= 6;

  if (!pix) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4 text-flor-600">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-flor-400" aria-label="Carregando" />
        <p className="text-sm">Carregando dados do PIX…</p>
        {showPixTimeoutHelp && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950 space-y-3">
            <p>
              O QR Code ainda não apareceu. Confira se a API está com{' '}
              <code className="rounded bg-amber-100 px-1 text-xs">
                PAYMENT_PROVIDER=mercado_pago
              </code>{' '}
              e o access token de <strong>teste</strong> do Mercado Pago, e se o pedido foi criado
              com pagamento PIX.
            </p>
            <Link
              href={orderId ? `/conta/pedidos/${orderId}` : '/conta/pedidos'}
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-flor-300 bg-white px-4 text-sm font-medium text-flor-800 transition hover:bg-flor-50"
            >
              Ver pedido na conta
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-2xl font-normal text-flor-800">Pague com PIX</h1>
        <p className="text-sm text-flor-500">
          Pedido <span className="font-medium text-flor-800">{order.number}</span> — valor{' '}
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            order.total,
          )}
        </p>
      </div>
      <PixDisplay
        qrCodeBase64={pix.qrCodeBase64}
        copyPaste={pix.copyPaste}
        expiresAtIso={pix.expiresAtIso}
      />
      <p className="text-center text-xs text-flor-500">
        Confirmamos automaticamente quando o pagamento for aprovado.
      </p>
    </div>
  );
}

export default function AguardandoPixPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <CheckoutHeader />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-flor-600" />
            </div>
          }
        >
          <AguardandoPixContent />
        </Suspense>
      </main>
      <CheckoutFooter />
    </div>
  );
}
