'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { StepAddress } from '@/components/loja/checkout/step-address';
import { StepShipping } from '@/components/loja/checkout/step-shipping';
import { CheckoutPurchaseSummary } from '@/components/loja/checkout/checkout-purchase-summary';
import {
  PaymentMethodSelector,
  type CheckoutPaymentMethod,
} from '@/components/loja/checkout/payment-method-selector';
import { PixInstructions } from '@/components/loja/checkout/pix-instructions';
import {
  CardCheckoutPanel,
  type CardTokenPayload,
} from '@/components/loja/checkout/card-checkout-panel';
import { createOrder } from '@/lib/api/orders';
import { processPayment } from '@/lib/api/payments';
import { getUserFacingErrorMessage } from '@/lib/errors';

/** Etapa 2: entrega + resumo + PIX (gera QR na próxima página) ou cartão (cobra aqui). */
export function StepCheckoutPayment() {
  const router = useRouter();
  const { cart, clearCart, refreshCart, couponValidation } = useCart();
  const {
    state,
    setPayment,
    setGiftWrap,
    clearCheckout,
    markLeavingAfterSuccessfulOrder,
    clearLeavingAfterSuccessfulOrder,
  } = useCheckout();
  const { identification, address, shipping, payment, giftWrap } = state;

  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [pixSubmitting, setPixSubmitting] = useState(false);
  const couponDiscount = couponValidation?.valid ? couponValidation.discount : 0;
  const isFreeShipping =
    couponValidation?.valid && couponValidation.coupon?.type === 'FREE_SHIPPING';
  const shippingCost = isFreeShipping ? 0 : (shipping?.cost ?? 0);
  const total = (cart?.subtotal ?? 0) - couponDiscount + shippingCost;
  const method: CheckoutPaymentMethod = payment?.method ?? 'PIX';
  const payerEmail = identification?.email;
  const paymentLabel = method === 'PIX' ? 'Pix' : 'Cartão de crédito';

  const setMethod = (m: CheckoutPaymentMethod) => {
    if (m === method) return;
    setPayment({ method: m });
  };

  const pixReady = !!address && !!shipping && method === 'PIX';

  const handleGeneratePix = useCallback(async () => {
    if (!identification || !address || !shipping) {
      toast.error('Confirme endereço e frete antes de gerar o PIX.');
      return;
    }

    setPixSubmitting(true);
    try {
      const orderNotes = giftWrap ? 'Embrulho para presente solicitado.' : undefined;

      const order = await createOrder({
        addressId: address.addressId,
        shippingOption: {
          carrier: shipping.carrier,
          service: shipping.service,
          cost: shipping.cost,
          estimatedDays: shipping.estimatedDays,
        },
        paymentMethod: 'PIX',
        cpf: identification.cpf,
        notes: orderNotes,
      });

      const res = await processPayment({ orderId: order.id, method: 'PIX' });
      if (res.method !== 'PIX') throw new Error('Resposta PIX inválida');

      markLeavingAfterSuccessfulOrder();
      clearCart();
      clearCheckout();
      router.push(
        `/checkout/aguardando-pix?orderId=${encodeURIComponent(order.id)}&paymentId=${encodeURIComponent(res.paymentId)}`,
      );
    } catch (err: unknown) {
      clearLeavingAfterSuccessfulOrder();
      await refreshCart();
      const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
      if (raw.includes('Carrinho está vazio') || raw.includes('vazio')) {
        toast.error(
          'Sacola já foi usada neste pedido ou está vazia no servidor. Atualizamos o carrinho — confira em Meus pedidos se o pedido já foi criado.',
        );
      } else {
        toast.error(getUserFacingErrorMessage(err));
      }
    } finally {
      setPixSubmitting(false);
    }
  }, [
    identification,
    address,
    shipping,
    giftWrap,
    clearCart,
    clearCheckout,
    router,
    refreshCart,
    markLeavingAfterSuccessfulOrder,
    clearLeavingAfterSuccessfulOrder,
  ]);

  const handleCardSubmit = useCallback(
    async (p: CardTokenPayload) => {
      if (!identification || !address || !shipping) {
        toast.error('Selecione endereço e frete antes de pagar com cartão.');
        throw new Error('checkout-incomplete');
      }

      setCardSubmitting(true);
      try {
        const orderNotes = giftWrap ? 'Embrulho para presente solicitado.' : undefined;

        const order = await createOrder({
          addressId: address.addressId,
          shippingOption: {
            carrier: shipping.carrier,
            service: shipping.service,
            cost: shipping.cost,
            estimatedDays: shipping.estimatedDays,
          },
          paymentMethod: 'CREDIT_CARD',
          cpf: identification.cpf,
          notes: orderNotes,
        });

        const res = await processPayment({
          orderId: order.id,
          method: 'CREDIT_CARD',
          cardToken: p.cardToken,
          paymentMethodId: p.paymentMethodId,
          installments: p.installments,
        });

        if (res.method !== 'CREDIT_CARD') throw new Error('Resposta de cartão inválida');

        if (res.status === 'APPROVED') {
          markLeavingAfterSuccessfulOrder();
          clearCart();
          clearCheckout();
          router.push(`/pedido/confirmacao/${order.id}`);
          return;
        }

        markLeavingAfterSuccessfulOrder();
        clearCart();
        clearCheckout();
        router.push(`/checkout/falha/${order.id}`);
      } catch (err: unknown) {
        clearLeavingAfterSuccessfulOrder();
        await refreshCart();
        const raw =
          err instanceof Error ? err.message : typeof err === 'string' ? err : String(err);
        let stockToast = false;
        try {
          const parsed = JSON.parse(raw) as { error?: string; items?: unknown[] };
          if (parsed.error === 'INSUFFICIENT_STOCK' && parsed.items?.length) {
            toast.error(`Estoque insuficiente para ${parsed.items.length} item(ns).`);
            stockToast = true;
          }
        } catch {
          // not JSON
        }
        if (!stockToast) toast.error(getUserFacingErrorMessage(err));
        throw err;
      } finally {
        setCardSubmitting(false);
      }
    },
    [
      identification,
      address,
      shipping,
      giftWrap,
      clearCart,
      clearCheckout,
      router,
      refreshCart,
      markLeavingAfterSuccessfulOrder,
      clearLeavingAfterSuccessfulOrder,
    ],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col items-center gap-2 border-b border-stone-200 pb-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div>
          <h1 className="font-serif text-2xl font-normal tracking-tight text-flor-900 md:text-3xl">
            Finalizar compra
          </h1>
          <p className="mt-1 max-w-xl text-sm text-stone-600">
            <strong>PIX:</strong> em Formas de pagamento, use <strong>Gerar código PIX</strong>.{' '}
            <strong>Cartão:</strong> botão <strong>Pagar</strong> do Mercado Pago no formulário.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-700">
          <Lock className="h-4 w-4" aria-hidden />
          Compra segura
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Endereço de entrega
            </h2>
            <div className="mt-4">
              <StepAddress />
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Opções de entrega
            </h2>
            <div className="mt-4">
              <StepShipping />
            </div>
          </section>

          <section
            id="checkout-pagamento"
            className="scroll-mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-6"
          >
            <h2 className="font-serif text-lg font-normal text-stone-900">Formas de pagamento</h2>
            <div className="mt-4 space-y-4">
              <PaymentMethodSelector value={method} onChange={setMethod} />
              {method === 'PIX' && (
                <>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
                    <p className="text-sm text-stone-700">
                      Com endereço e frete ok, gere o código. Na próxima página aparecem o{' '}
                      <strong>QR Code</strong> e o <strong>copia e cola</strong>.
                    </p>
                    <Button
                      type="button"
                      className="mt-4 h-11 w-full max-w-md rounded-lg bg-[#5c4033] text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#4a342a] disabled:opacity-50"
                      disabled={!pixReady || pixSubmitting}
                      onClick={() => void handleGeneratePix()}
                    >
                      {pixSubmitting ? 'Gerando…' : 'Gerar código PIX'}
                    </Button>
                    {!pixReady && (
                      <p className="mt-2 text-xs text-amber-800">
                        Preencha <strong>endereço</strong> e <strong>frete</strong> acima para
                        habilitar.
                      </p>
                    )}
                  </div>
                  <PixInstructions />
                </>
              )}
              {method === 'CREDIT_CARD' && (
                <CardCheckoutPanel
                  total={total}
                  payerEmail={payerEmail}
                  onCardSubmit={handleCardSubmit}
                  isSubmitting={cardSubmitting}
                />
              )}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-4">
            <CheckoutPurchaseSummary
              cart={cart}
              shippingCost={shippingCost}
              discount={couponDiscount}
              paymentLabel={paymentLabel}
              giftWrap={giftWrap ?? false}
              onGiftWrapChange={setGiftWrap}
            />
            {method === 'CREDIT_CARD' && (
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-center text-xs text-stone-600">
                Use o botão <strong>Pagar</strong> do Mercado Pago no formulário ao lado.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
