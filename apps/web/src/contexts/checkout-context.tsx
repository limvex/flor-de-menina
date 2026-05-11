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

function isStepComplete(state: CheckoutState, step: CheckoutStep): boolean {
  if (step === 1) return state.identification !== null;
  if (step === 2) return state.address !== null;
  if (step === 3) return state.shipping !== null;
  if (step === 4) return state.payment !== null;
  return false;
}

interface CheckoutContextValue {
  state: CheckoutState;
  goToStep: (step: CheckoutStep) => void;
  setIdentification: (data: CheckoutIdentification) => void;
  setAddress: (data: CheckoutAddress) => void;
  setShipping: (data: ShippingOption) => void;
  setPayment: (data: CheckoutPayment, options?: { advance?: boolean }) => void;
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
        setState(parsed);
      }
    } catch {
      // ignore parse errors
    }
    hydrated.current = true;
  }, []);

  const persist = useCallback((next: CheckoutState) => {
    try {
      // Never persist payment card data — only persist method name
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
      update((prev) => ({ ...prev, step }));
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
    (data: CheckoutPayment, options?: { advance?: boolean }) => {
      const advance = options?.advance !== false;
      update((prev) => ({
        ...prev,
        payment: data,
        step: advance ? 5 : prev.step,
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
