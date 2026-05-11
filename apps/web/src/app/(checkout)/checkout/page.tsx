'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { CheckoutHeader } from '@/components/loja/checkout/checkout-header';
import { CheckoutFooter } from '@/components/loja/checkout/checkout-footer';
import { CheckoutStepper } from '@/components/loja/checkout/checkout-stepper';
import { StepIdentification } from '@/components/loja/checkout/step-identification';
import { StepCheckoutPayment } from '@/components/loja/checkout/step-checkout-payment';
import { api } from '@/lib/api/client';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
}

function CheckoutPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state,
    clearCheckout,
    setPayment,
    clearLeavingAfterSuccessfulOrder,
    isLeavingAfterSuccessfulOrder,
  } = useCheckout();

  const { data: profile } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: () => api.get<UserProfile>('/customer/profile'),
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    return () => {
      clearLeavingAfterSuccessfulOrder();
    };
  }, [clearLeavingAfterSuccessfulOrder]);

  useEffect(() => {
    if (authLoading || cartLoading) return;
    if (!user) {
      router.replace('/login?redirect=/checkout');
      return;
    }
    if (state.identification && state.identification.email !== user.email) {
      clearCheckout();
    }
    if (cart && cart.items.length === 0 && !isLeavingAfterSuccessfulOrder()) {
      router.replace('/carrinho');
    }
  }, [
    authLoading,
    cartLoading,
    user,
    cart,
    router,
    state.identification,
    clearCheckout,
    isLeavingAfterSuccessfulOrder,
  ]);

  useEffect(() => {
    if (searchParams.get('pref') !== 'pix') return;
    setPayment({ method: 'PIX' });
    router.replace('/checkout', { scroll: false });
  }, [searchParams, setPayment, router]);

  if (authLoading || cartLoading || !user || !cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CheckoutHeader />

      <div className="border-b border-stone-200/80 bg-white py-4 px-4">
        <div className="mx-auto max-w-6xl">
          <CheckoutStepper />
        </div>
      </div>

      <main className="flex-1 bg-flor-50 py-6 md:py-10">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          {state.step === 1 && (
            <div className="mx-auto max-w-md space-y-6 pt-2 md:max-w-lg md:pt-6">
              <div className="text-center">
                <h1 className="font-serif text-2xl font-normal text-flor-900 md:text-3xl">
                  Finalizar compra
                </h1>
                <p className="mt-2 text-sm text-stone-600">
                  Em dois passos você finaliza de forma rápida e segura.
                </p>
              </div>
              <StepIdentification userProfile={profile ?? null} />
            </div>
          )}
          {state.step === 2 && <StepCheckoutPayment />}
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center bg-flor-50 text-sm text-stone-500">
          Carregando checkout…
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
