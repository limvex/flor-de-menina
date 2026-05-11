'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type {
  CheckoutStep,
  CheckoutState,
  CheckoutIdentification,
  CheckoutAddress,
  CheckoutPayment,
  ShippingOption,
} from '@flor/types';

const STORAGE_KEY = 'flor_checkout';

const EMPTY_STATE: CheckoutState = {
  step: 1,
  identification: null,
  address: null,
  shipping: null,
  payment: null,
  giftWrap: false,
};

function mergePayment(prev: CheckoutPayment | null, incoming: CheckoutPayment): CheckoutPayment {
  if (incoming.method === 'PIX') {
    return { method: 'PIX' };
  }
  return {
    method: 'CREDIT_CARD',
    cardToken: incoming.cardToken ?? prev?.cardToken,
    paymentMethodId: incoming.paymentMethodId ?? prev?.paymentMethodId,
    installments: incoming.installments ?? prev?.installments ?? 1,
  };
}

function isStepComplete(state: CheckoutState, step: CheckoutStep): boolean {
  if (step === 1) return state.identification !== null;
  if (step === 2) return state.address !== null && state.shipping !== null;
  return false;
}

interface CheckoutContextValue {
  state: CheckoutState;
  goToStep: (step: CheckoutStep) => void;
  setIdentification: (data: CheckoutIdentification) => void;
  setAddress: (data: CheckoutAddress) => void;
  setShipping: (data: ShippingOption) => void;
  setPayment: (data: CheckoutPayment) => void;
  setGiftWrap: (value: boolean) => void;
  clearCheckout: () => void;
  canGoToStep: (step: CheckoutStep) => boolean;
  /**
   * Chame antes de esvaziar o carrinho ao concluir pedido (PIX/cartão).
   * Evita que `/checkout` faça `replace('/carrinho')` na mesma render que `router.push` da próxima tela.
   */
  markLeavingAfterSuccessfulOrder: () => void;
  clearLeavingAfterSuccessfulOrder: () => void;
  isLeavingAfterSuccessfulOrder: () => boolean;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CheckoutState>(EMPTY_STATE);
  const hydrated = useRef(false);
  const leavingAfterSuccessfulOrder = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CheckoutState;
        const rawStep = parsed.step as number;
        const step = (rawStep > 2 ? 2 : rawStep) as CheckoutStep;
        setState({ ...parsed, step, giftWrap: parsed.giftWrap ?? false });
      }
    } catch {
      // ignore parse errors
    }
    hydrated.current = true;
  }, []);

  const persist = useCallback((next: CheckoutState) => {
    try {
      const safe: CheckoutState = {
        ...next,
        payment: next.payment ? { method: next.payment.method } : null,
        giftWrap: next.giftWrap,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch {
      // ignore storage errors
    }
  }, []);

  const update = useCallback(
    (updater: (prev: CheckoutState) => CheckoutState) => {
      setState((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const canGoToStep = useCallback(
    (step: CheckoutStep): boolean => {
      if (step === 1) return true;
      for (let s = 1; s < step; s++) {
        if (!isStepComplete(state, s as CheckoutStep)) return false;
      }
      return true;
    },
    [state],
  );

  const goToStep = useCallback(
    (step: CheckoutStep) => {
      if (!canGoToStep(step)) return;
      update((prev) => ({
        ...prev,
        step,
      }));
    },
    [canGoToStep, update],
  );

  const setIdentification = useCallback(
    (data: CheckoutIdentification) => {
      update((prev) => ({
        ...prev,
        identification: data,
        step: 2,
      }));
    },
    [update],
  );

  const setAddress = useCallback(
    (data: CheckoutAddress) => {
      update((prev) => ({
        ...prev,
        address: data,
        step: Math.max(prev.step, 2) as CheckoutStep,
      }));
    },
    [update],
  );

  const setShipping = useCallback(
    (data: ShippingOption) => {
      update((prev) => ({
        ...prev,
        shipping: data,
      }));
    },
    [update],
  );

  const setPayment = useCallback(
    (incoming: CheckoutPayment) => {
      update((prev) => ({
        ...prev,
        payment: mergePayment(prev.payment, incoming),
      }));
    },
    [update],
  );

  const setGiftWrap = useCallback(
    (value: boolean) => {
      update((prev) => ({ ...prev, giftWrap: value }));
    },
    [update],
  );

  const clearCheckout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(EMPTY_STATE);
  }, []);

  const markLeavingAfterSuccessfulOrder = useCallback(() => {
    leavingAfterSuccessfulOrder.current = true;
  }, []);

  const clearLeavingAfterSuccessfulOrder = useCallback(() => {
    leavingAfterSuccessfulOrder.current = false;
  }, []);

  const isLeavingAfterSuccessfulOrder = useCallback(() => leavingAfterSuccessfulOrder.current, []);

  return (
    <CheckoutContext.Provider
      value={{
        state,
        goToStep,
        setIdentification,
        setAddress,
        setShipping,
        setPayment,
        setGiftWrap,
        clearCheckout,
        canGoToStep,
        markLeavingAfterSuccessfulOrder,
        clearLeavingAfterSuccessfulOrder,
        isLeavingAfterSuccessfulOrder,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}
