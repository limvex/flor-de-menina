'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { stockApi, type MovementType, type MovementSource } from '@/lib/api/stock';
import { getUserFacingErrorMessage } from '@/lib/errors';
import type { VariantStockSummary } from '@flor/types';

interface MovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: VariantStockSummary & { productName: string };
  onSuccess: () => void;
}

type FormValues = {
  type: MovementType;
  source: MovementSource;
  quantity: number;
  reason: string;
  allowNegative: boolean;
};

const SOURCE_BY_TYPE: Record<MovementType, { value: MovementSource; label: string }[]> = {
  IN: [
    { value: 'MANUAL_IN', label: 'Recebimento de fornecedor' },
    { value: 'RETURN', label: 'Devolução de cliente' },
  ],
  OUT: [{ value: 'LOSS', label: 'Perda / Avaria' }],
  ADJUST: [{ value: 'MANUAL_ADJUST', label: 'Inventário / Correção' }],
};

export function MovementModal({ open, onOpenChange, variant, onSuccess }: MovementModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: 'IN',
      source: 'MANUAL_IN',
      quantity: 1,
      reason: '',
      allowNegative: false,
    },
  });

  const type = watch('type');
  const quantity = watch('quantity');
  const allowNegative = watch('allowNegative');

  useEffect(() => {
    const sources = SOURCE_BY_TYPE[type];
    if (sources.length > 0) {
      setValue('source', sources[0].value);
    }
  }, [type, setValue]);

  const previewStock = (() => {
    const q = Number(quantity) || 0;
    if (type === 'IN') return variant.stock + q;
    if (type === 'OUT') return variant.stock - q;
    return q; // ADJUST = alvo final
  })();

  const wouldGoNegative = previewStock < 0;
  const canSubmit = !wouldGoNegative || allowNegative;

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      await stockApi.createMovement({
        variantId: variant.id,
        type: data.type,
        source: data.source,
        quantity: Number(data.quantity),
        reason: data.reason || undefined,
        allowNegative: data.allowNegative,
      });
      toast.success('Movimentação registrada com sucesso');
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentar estoque</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {variant.productName} · {[variant.size, variant.color].filter(Boolean).join(' / ')}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo de movimento</Label>
            <div className="flex gap-3">
              {(['IN', 'OUT', 'ADJUST'] as MovementType[]).map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="radio" value={t} {...register('type')} className="accent-flor-600" />
                  {t === 'IN' ? 'Entrada' : t === 'OUT' ? 'Saída' : 'Ajuste'}
                </label>
              ))}
            </div>
          </div>

          {/* Motivo (source) */}
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue>
                      {SOURCE_BY_TYPE[type].find((s) => s.value === field.value)?.label ??
                        'Selecione o motivo'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_BY_TYPE[type].map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label htmlFor="quantity">
              {type === 'ADJUST'
                ? 'Estoque final desejado'
                : type === 'IN'
                  ? 'Quantidade a adicionar'
                  : 'Quantidade a remover'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              {...register('quantity', { valueAsNumber: true, min: 1, required: true })}
              className={errors.quantity ? 'border-red-400' : ''}
            />
          </div>

          {/* Preview */}
          <div
            className={`rounded-md px-3 py-2 text-sm font-medium ${wouldGoNegative ? 'bg-red-50 text-red-700' : 'bg-flor-50 text-flor-700'}`}
          >
            Estoque atual: <strong>{variant.stock}</strong> → Estoque após:{' '}
            <strong>{previewStock}</strong>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <Label htmlFor="reason">Observação (opcional)</Label>
            <Input
              id="reason"
              {...register('reason')}
              maxLength={280}
              placeholder="Detalhes adicionais..."
            />
          </div>

          {/* Allow negative */}
          {(type === 'OUT' || type === 'ADJUST') && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="allowNegative"
                checked={allowNegative}
                onCheckedChange={(v) => setValue('allowNegative', Boolean(v))}
              />
              <Label htmlFor="allowNegative" className="text-sm font-normal cursor-pointer">
                Permitir estoque negativo
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
