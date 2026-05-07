'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { stockApi } from '@/lib/api/stock';
import type { VariantStockSummary } from '@flor/types';

interface CounterSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: VariantStockSummary & { productName: string };
  onSuccess: () => void;
}

type FormValues = {
  quantity: number;
  reason: string;
  allowNegative: boolean;
};

export function CounterSaleModal({
  open,
  onOpenChange,
  variant,
  onSuccess,
}: CounterSaleModalProps) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { quantity: 1, reason: '', allowNegative: false },
  });

  const quantity = watch('quantity');
  const allowNegative = watch('allowNegative');
  const previewStock = variant.stock - (Number(quantity) || 0);
  const wouldGoNegative = previewStock < 0;

  useEffect(() => {
    if (open) {
      reset({ quantity: 1, reason: '', allowNegative: false });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, reset]);

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const result = await stockApi.counterSale({
        variantId: variant.id,
        quantity: Number(data.quantity),
        reason: data.reason || undefined,
        allowNegative: data.allowNegative,
      });
      toast.success(`Baixa registrada — estoque atual: ${result.stockAfter}`);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar venda');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Venda balcão</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {variant.productName} · {[variant.size, variant.color].filter(Boolean).join(' / ')}
            <span className="ml-2 text-xs text-flor-500">Estoque atual: {variant.stock}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cs-quantity">Quantidade vendida</Label>
            <Input
              id="cs-quantity"
              type="number"
              min={1}
              autoFocus
              aria-keyshortcuts="Enter"
              {...register('quantity', { valueAsNumber: true, min: 1, required: true })}
              ref={(el) => {
                register('quantity').ref(el);
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
              }}
              className={errors.quantity ? 'border-red-400' : ''}
            />
          </div>

          <p
            className={`text-sm font-medium ${wouldGoNegative ? 'text-red-600' : 'text-flor-600'}`}
          >
            Estoque após: <strong>{previewStock}</strong>
          </p>

          <Input
            placeholder="Cliente, forma de pagamento, etc. (opcional)"
            {...register('reason')}
            maxLength={280}
          />

          {wouldGoNegative && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="cs-allow-neg"
                checked={allowNegative}
                onCheckedChange={(v) => setValue('allowNegative', Boolean(v))}
              />
              <Label
                htmlFor="cs-allow-neg"
                className="text-sm font-normal cursor-pointer text-red-600"
              >
                Permitir estoque negativo
              </Label>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || (wouldGoNegative && !allowNegative)}
            >
              {loading ? 'Salvando...' : 'Confirmar venda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
