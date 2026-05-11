'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { CheckoutHeader } from '@/components/loja/checkout/checkout-header';
import { CheckoutFooter } from '@/components/loja/checkout/checkout-footer';
import { CheckoutStepper } from '@/components/loja/checkout/checkout-stepper';
import { CheckoutSummary } from '@/components/loja/checkout/checkout-summary';
import { StepIdentification } from '@/components/loja/checkout/step-identification';
import { StepAddress } from '@/components/loja/checkout/step-address';
import { StepShipping } from '@/components/loja/checkout/step-shipping';
import { StepReview } from '@/components/loja/checkout/step-review';
import { api } from '@/lib/api/client';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();
  const { state, clearCheckout } = useCheckout();

  const { data: profile } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: () => api.get<UserProfile>('/customer/profile'),
    enabled: !!user,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (authLoading || cartLoading) return;
    if (!user) {
      router.replace('/login?redirect=/checkout');
      return;
    }
    // Clear stale checkout state if it belongs to a different user
    if (state.identification && state.identification.email !== user.email) {
      clearCheckout();
    }
    if (cart && cart.items.length === 0) {
      router.replace('/carrinho');
    }
  }, [authLoading, cartLoading, user, cart, router, state.identification, clearCheckout]);

  if (authLoading || cartLoading || !user || !cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <CheckoutHeader />

      <div className="border-b border-flor-100 bg-white py-4 px-4">
        <div className="mx-auto max-w-6xl">
          <CheckoutStepper />
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="order-2 lg:order-1">
              {state.step === 1 && <StepIdentification userProfile={profile ?? null} />}
              {state.step === 2 && <StepAddress />}
              {state.step === 3 && <StepShipping />}
              {state.step === 4 && <StepReview />}
            </div>

            <div className="order-1 lg:order-2">
              <CheckoutSummary />
            </div>
          </div>
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}
