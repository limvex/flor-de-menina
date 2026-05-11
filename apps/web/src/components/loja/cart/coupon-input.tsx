'use client';

import { useState, useRef } from 'react';
import { Tag, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { CouponValidationResult } from '@flor/types';

const ERROR_MESSAGES: Record<string, (details?: Record<string, unknown>) => string> = {
  NOT_FOUND: () => 'Cupom não encontrado',
  INACTIVE: () => 'Cupom indisponível no momento',
  NOT_STARTED: () => 'Cupom ainda não está disponível',
  EXPIRED: () => 'Este cupom expirou',
  EXHAUSTED: () => 'Cupom esgotado',
  MIN_CART_VALUE_NOT_MET: (d) => {
    const remaining = d ? (d['required'] as number) - (d['current'] as number) : 0;
    return `Adicione mais ${formatPrice(remaining)} para usar este cupom`;
  },
  NOT_FIRST_ORDER: () => 'Cupom válido apenas para primeira compra',
  LOGIN_REQUIRED: () => 'Faça login para usar este cupom',
  USER_LIMIT_REACHED: () => 'Você já atingiu o limite deste cupom',
  NO_ELIGIBLE_ITEMS: () => 'Nenhum item do carrinho é elegível para este cupom',
};

function formatError(error: { code: string; details?: Record<string, unknown> }): string {
  const formatter = ERROR_MESSAGES[error.code];
  return formatter ? formatter(error.details) : 'Cupom inválido';
}

interface CouponInputProps {
  appliedCode: string | null;
  validation: CouponValidationResult | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => Promise<void>;
  isLoading: boolean;
}

export function CouponInput({
  appliedCode,
  validation,
  onApply,
  onRemove,
  isLoading,
}: CouponInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasApplied = !!appliedCode;
  const isValid = hasApplied && validation?.valid;
  const isInvalid = hasApplied && validation && !validation.valid;
  const errorMessage =
    isInvalid && validation.errors?.[0] ? formatError(validation.errors[0]) : null;

  async function handleApply() {
    const code = inputValue.trim().toUpperCase();
    if (!code) return;
    await onApply(code);
    setInputValue('');
  }

  async function handleRemove() {
    await onRemove();
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleApply();
    }
  }

  if (isValid && appliedCode) {
    const couponType = validation.coupon?.type;
    let discountLabel = '';
    if (couponType === 'FREE_SHIPPING') {
      discountLabel = 'Frete grátis aplicado';
    } else if (validation.discount > 0) {
      discountLabel = `−${formatPrice(validation.discount)}`;
      if (validation.appliedToItemsCount < validation.totalItemsCount) {
        discountLabel += ` (${validation.appliedToItemsCount} de ${validation.totalItemsCount} itens)`;
      }
    }

    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-800 font-mono tracking-wide">
                {appliedCode}
              </p>
              {discountLabel && <p className="text-xs text-green-700">{discountLabel}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={isLoading}
            aria-label="Remover cupom"
            className="shrink-0 rounded p-1 text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (isInvalid && appliedCode) {
    return (
      <div className="space-y-2">
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 font-mono">{appliedCode}</p>
                <p className="text-xs text-amber-700" id="coupon-error-msg">
                  {errorMessage}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={isLoading}
              aria-label="Remover cupom inválido"
              className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <CouponInputField
          inputRef={inputRef}
          value={inputValue}
          onChange={setInputValue}
          onKeyDown={handleKeyDown}
          onApply={() => void handleApply()}
          isLoading={isLoading}
          placeholder="Aplicar outro cupom"
        />
      </div>
    );
  }

  return (
    <CouponInputField
      inputRef={inputRef}
      value={inputValue}
      onChange={setInputValue}
      onKeyDown={handleKeyDown}
      onApply={() => void handleApply()}
      isLoading={isLoading}
    />
  );
}

interface FieldProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onApply: () => void;
  isLoading: boolean;
  placeholder?: string;
}

function CouponInputField({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onApply,
  isLoading,
  placeholder = 'Tem um cupom?',
}: FieldProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          aria-label="Código do cupom"
          aria-describedby={value ? undefined : 'coupon-hint'}
          className="w-full h-9 rounded-lg border border-stone-200 bg-white pl-8 pr-3 text-sm font-mono tracking-wide text-stone-800 placeholder:text-stone-400 placeholder:font-sans placeholder:tracking-normal focus:border-flor-400 focus:outline-none focus:ring-1 focus:ring-flor-300 disabled:opacity-50 transition-colors"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={isLoading || !value.trim()}
        className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 active:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
      </button>
    </div>
  );
}
