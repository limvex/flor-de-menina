'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCheckout } from '@/contexts/checkout-context';
import type { CheckoutStep } from '@flor/types';

const STEPS: { step: CheckoutStep; label: string }[] = [
  { step: 1, label: 'Identificação' },
  { step: 2, label: 'Endereço' },
  { step: 3, label: 'Entrega' },
  { step: 4, label: 'Revisão' },
];

export function CheckoutStepper() {
  const { state, goToStep, canGoToStep } = useCheckout();
  const currentStep = state.step;

  return (
    <nav aria-label="Etapas do checkout">
      <ol className="hidden md:flex items-center justify-center gap-0">
        {STEPS.map(({ step, label }, idx) => {
          const isDone = step < currentStep;
          const isCurrent = step === currentStep;
          const isClickable = isDone && canGoToStep(step);

          return (
            <li key={step} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && goToStep(step)}
                disabled={!isClickable}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1.5 px-3',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                    isDone && 'border-flor-800 bg-flor-800 text-white',
                    isCurrent && 'border-flor-800 bg-white text-flor-800',
                    !isDone && !isCurrent && 'border-flor-200 bg-white text-flor-300',
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : step}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    isCurrent && 'font-semibold text-flor-800',
                    isDone && 'text-flor-600',
                    !isDone && !isCurrent && 'text-flor-300',
                  )}
                >
                  {label}
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'h-px w-12 mb-5 transition-colors',
                    step < currentStep ? 'bg-flor-800' : 'bg-flor-200',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="md:hidden flex items-center justify-center gap-2 py-1">
        {STEPS.map(({ step }) => (
          <div
            key={step}
            className={cn(
              'h-1.5 rounded-full transition-all',
              step < currentStep && 'w-4 bg-flor-800',
              step === currentStep && 'w-6 bg-flor-800',
              step > currentStep && 'w-4 bg-flor-200',
            )}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-flor-800">
          Etapa {currentStep} de {STEPS.length} — {STEPS.find((s) => s.step === currentStep)?.label}
        </span>
      </div>
    </nav>
  );
}
