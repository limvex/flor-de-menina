'use client';

import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { PixInstructions } from './pix-instructions';
import { PaymentMethodSelector, type CheckoutPaymentMethod } from './payment-method-selector';
import { CardCheckoutPanel } from './card-checkout-panel';

export function StepPayment() {
  const { cart } = useCart();
  const { state, setPayment } = useCheckout();
  const shippingCost = state.shipping?.cost ?? 0;
  const total = (cart?.subtotal ?? 0) + shippingCost;

  const method: CheckoutPaymentMethod = state.payment?.method ?? 'PIX';

  const setMethod = (m: CheckoutPaymentMethod) => {
    if (m === method) return;
    setPayment({ method: m }, { advance: false });
  };

  const payerEmail = state.identification?.email;

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl font-normal text-flor-800">Forma de pagamento</h2>

      <PaymentMethodSelector value={method} onChange={setMethod} />

      {method === 'PIX' && (
        <>
          <PixInstructions />
          <Button
            type="button"
            className="w-full bg-flor-800 hover:bg-flor-700 text-white"
            onClick={() => setPayment({ method: 'PIX' })}
          >
            Continuar
          </Button>
        </>
      )}

      {method === 'CREDIT_CARD' && (
        <CardCheckoutPanel
          total={total}
          payerEmail={payerEmail}
          onCardReady={(p) =>
            setPayment({
              method: 'CREDIT_CARD',
              cardToken: p.cardToken,
              paymentMethodId: p.paymentMethodId,
              installments: p.installments,
            })
          }
        />
      )}
    </div>
  );
}
