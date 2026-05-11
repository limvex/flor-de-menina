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
  if (step === 2) return state.address !== null;
  if (step === 3) return state.shipping !== null;
  return false;
}

interface CheckoutContextValue {
  state: CheckoutState;
  goToStep: (step: CheckoutStep) => void;
  setIdentification: (data: CheckoutIdentification) => void;
  setAddress: (data: CheckoutAddress) => void;
  setShipping: (data: ShippingOption) => void;
  setPayment: (data: CheckoutPayment) => void;
  clearCheckout: () => void;
  canGoToStep: (step: CheckoutStep) => boolean;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CheckoutState>(EMPTY_STATE);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CheckoutState;
        const rawStep = parsed.step as number;
        const step = rawStep > 4 ? 4 : (parsed.step as CheckoutStep);
        setState({ ...parsed, step });
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
        payment: step === 4 && !prev.payment ? { method: 'PIX' } : prev.payment,
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
        step: 3,
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

  const clearCheckout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(EMPTY_STATE);
  }, []);

  return (
    <CheckoutContext.Provider
      value={{
        state,
        goToStep,
        setIdentification,
        setAddress,
        setShipping,
        setPayment,
        clearCheckout,
        canGoToStep,
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
