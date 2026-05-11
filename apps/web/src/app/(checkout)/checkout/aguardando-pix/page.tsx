'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
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

function AguardandoPixContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const orderId = search.get('orderId');
  const paymentId = search.get('paymentId');

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const p = order.payment;
  if (!p?.qrCodeBase64 || !p.pixCopyPaste || !p.pixExpiresAt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-flor-600">
        <p>Aguardando dados do PIX…</p>
        <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-flor-400" />
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
        qrCodeBase64={p.qrCodeBase64}
        copyPaste={p.pixCopyPaste}
        expiresAtIso={p.pixExpiresAt}
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
