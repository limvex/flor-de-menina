'use client';

import { useState } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/format-currency-input';
import { type NewProductFormData } from './new-product-schema';

interface PricingStepProps {
  control: Control<NewProductFormData>;
  errors: FieldErrors<NewProductFormData>;
}

export function PricingStep({ control, errors }: PricingStepProps) {
  const [basePriceDisplay, setBasePriceDisplay] = useState('');
  const [comparePriceDisplay, setComparePriceDisplay] = useState('');

  return (
    <section className="space-y-4 rounded-lg border border-bege-200 bg-white p-5 sm:p-6">
      <h2 className="font-serif text-lg text-flor-800">Preço</h2>

      <div>
        <Label htmlFor="basePrice">Preço de venda *</Label>
        <Controller
          name="basePrice"
          control={control}
          render={({ field }) => (
            <Input
              id="basePrice"
              value={basePriceDisplay}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setBasePriceDisplay(formatted);
                field.onChange(parseCurrencyInput(formatted));
              }}
              onBlur={field.onBlur}
              inputMode="numeric"
              className="mt-1.5"
              placeholder="R$ 0,00"
              autoComplete="off"
            />
          )}
        />
        {errors.basePrice && (
          <p className="text-xs text-destructive mt-1">{errors.basePrice.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="compareAtPrice">Preço comparativo</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Se quiser mostrar &quot;de R$ X por R$ Y&quot; na vitrine
        </p>
        <Controller
          name="compareAtPrice"
          control={control}
          rules={{
            validate: (value, formValues) => {
              if (value == null || value === undefined) return true;
              if (value <= formValues.basePrice) {
                return 'Preço comparativo deve ser maior que o preço de venda';
              }
              return true;
            },
          }}
          render={({ field }) => (
            <Input
              id="compareAtPrice"
              value={comparePriceDisplay}
              onChange={(e) => {
                const formatted = formatCurrencyInput(e.target.value);
                setComparePriceDisplay(formatted);
                const parsed = parseCurrencyInput(formatted);
                field.onChange(parsed > 0 ? parsed : undefined);
              }}
              onBlur={field.onBlur}
              inputMode="numeric"
              className="mt-1.5"
              placeholder="Opcional"
              autoComplete="off"
            />
          )}
        />
        {errors.compareAtPrice && (
          <p className="text-xs text-destructive mt-1">{errors.compareAtPrice.message}</p>
        )}
      </div>
    </section>
  );
}
