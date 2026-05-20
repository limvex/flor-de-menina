'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { CouponType, CouponSummary } from '@flor/types';
import type { CouponWithStatus } from '@/lib/admin/coupons-api';

interface CategoryOption {
  id: string;
  name: string;
}

interface CouponFormProps {
  mode: 'create' | 'edit';
  initial?: Partial<CouponWithStatus>;
  categories: CategoryOption[];
  onSubmit: (data: CouponFormData) => Promise<void>;
}

export interface CouponFormData {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  maxTotalUses: number | null;
  maxUsesPerCustomer: number;
  minCartValue: number | null;
  maxDiscountAmount: number | null;
  firstOrderOnly: boolean;
  categoryIds: string[];
}

function formatDateForInput(iso: string): string {
  return iso.slice(0, 16); // datetime-local format
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 16);
}

function thirtyDaysFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 16);
}

export function CouponForm({ mode, initial, categories, onSubmit }: CouponFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<CouponType>(initial?.type ?? 'PERCENTAGE');
  const [value, setValue] = useState(String(initial?.value ?? ''));
  const [validFrom, setValidFrom] = useState(
    initial?.validFrom ? formatDateForInput(initial.validFrom) : todayIso(),
  );
  const [validUntil, setValidUntil] = useState(
    initial?.validUntil ? formatDateForInput(initial.validUntil) : thirtyDaysFromNow(),
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [maxTotalUses, setMaxTotalUses] = useState(String(initial?.maxTotalUses ?? ''));
  const [maxUsesPerCustomer, setMaxUsesPerCustomer] = useState(
    String(initial?.maxUsesPerCustomer ?? '1'),
  );
  const [minCartValue, setMinCartValue] = useState(String(initial?.minCartValue ?? ''));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    String(initial?.maxDiscountAmount ?? ''),
  );
  const [firstOrderOnly, setFirstOrderOnly] = useState(initial?.firstOrderOnly ?? false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial?.categoryIds ?? [],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!code.trim()) e['code'] = 'Código obrigatório';
    if (code.trim() && !/^[A-Z0-9_-]+$/.test(code))
      e['code'] = 'Apenas letras maiúsculas, números, _ e -';
    if (new Date(validUntil) <= new Date(validFrom))
      e['validUntil'] = 'Data final deve ser depois da inicial';
    if (type !== 'FREE_SHIPPING') {
      const v = parseFloat(value);
      if (isNaN(v) || v <= 0) e['value'] = 'Valor deve ser positivo';
      if (type === 'PERCENTAGE' && v > 100) e['value'] = 'Percentual não pode exceder 100%';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: CouponFormData = {
      code: code.toUpperCase().trim(),
      description,
      type,
      value: type === 'FREE_SHIPPING' ? 0 : parseFloat(value),
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      isActive,
      maxTotalUses: maxTotalUses.trim() ? parseInt(maxTotalUses) : null,
      maxUsesPerCustomer: parseInt(maxUsesPerCustomer) || 1,
      minCartValue: minCartValue.trim() ? parseFloat(minCartValue) : null,
      maxDiscountAmount: maxDiscountAmount.trim() ? parseFloat(maxDiscountAmount) : null,
      firstOrderOnly,
      categoryIds: selectedCategories,
    };

    startTransition(async () => {
      try {
        await onSubmit(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao salvar cupom');
      }
    });
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  // Preview card
  const previewDiscount =
    type === 'FREE_SHIPPING'
      ? 'Frete grátis'
      : type === 'PERCENTAGE'
        ? `${value || '?'}% off`
        : `R$ ${value || '?'} off`;

  const previewMin = minCartValue ? ` (mínimo R$ ${minCartValue})` : '';
  const previewUntil = validUntil
    ? ` • válido até ${new Date(validUntil).toLocaleDateString('pt-BR')}`
    : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          {/* Informações básicas */}
          <fieldset className="rounded-lg border border-stone-200 p-5 space-y-4">
            <legend className="text-sm font-semibold text-stone-700 px-1">
              Informações básicas
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="code">Código do cupom *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="BEMVINDA10"
                  className="font-mono"
                  maxLength={30}
                />
                {errors['code'] && <p className="text-xs text-red-500">{errors['code']}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'PERCENTAGE' as CouponType, label: '%', sublabel: 'Percentual' },
                      { value: 'FIXED_AMOUNT' as CouponType, label: 'R$', sublabel: 'Valor fixo' },
                      {
                        value: 'FREE_SHIPPING' as CouponType,
                        label: '🚚',
                        sublabel: 'Frete grátis',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`rounded-lg border p-2 text-center transition-colors ${
                        type === opt.value
                          ? 'border-flor-600 bg-flor-50 text-flor-700'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-lg">{opt.label}</div>
                      <div className="text-[10px] font-medium mt-0.5">{opt.sublabel}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {type !== 'FREE_SHIPPING' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="value">
                    {type === 'PERCENTAGE'
                      ? 'Percentual de desconto (%)'
                      : 'Valor de desconto (R$)'}{' '}
                    *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    min={0}
                    max={type === 'PERCENTAGE' ? 100 : undefined}
                    step="0.01"
                    placeholder={type === 'PERCENTAGE' ? '10' : '30.00'}
                  />
                  {errors['value'] && <p className="text-xs text-red-500">{errors['value']}</p>}
                </div>
                {type === 'PERCENTAGE' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="maxDiscount">Teto máximo de desconto (R$)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      min={0}
                      step="0.01"
                      placeholder="50.00 (opcional)"
                    />
                    <p className="text-xs text-stone-400">Ex: 15% mas no máximo R$50</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição (interna)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Campanha de boas-vindas para novas clientes"
                rows={2}
                maxLength={200}
              />
            </div>
          </fieldset>

          {/* Validade */}
          <fieldset className="rounded-lg border border-stone-200 p-5 space-y-4">
            <legend className="text-sm font-semibold text-stone-700 px-1">Validade</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="validFrom">Data de início *</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="validUntil">Data de término *</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
                {errors['validUntil'] && (
                  <p className="text-xs text-red-500">{errors['validUntil']}</p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Limites */}
          <fieldset className="rounded-lg border border-stone-200 p-5 space-y-4">
            <legend className="text-sm font-semibold text-stone-700 px-1">Limites de uso</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="maxTotalUses">Usos totais máximos</Label>
                <Input
                  id="maxTotalUses"
                  type="number"
                  value={maxTotalUses}
                  onChange={(e) => setMaxTotalUses(e.target.value)}
                  min={1}
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxUsesPerCustomer">Usos por cliente</Label>
                <Input
                  id="maxUsesPerCustomer"
                  type="number"
                  value={maxUsesPerCustomer}
                  onChange={(e) => setMaxUsesPerCustomer(e.target.value)}
                  min={1}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minCartValue">Valor mínimo do carrinho (R$)</Label>
                <Input
                  id="minCartValue"
                  type="number"
                  value={minCartValue}
                  onChange={(e) => setMinCartValue(e.target.value)}
                  min={0}
                  step="0.01"
                  placeholder="Sem mínimo"
                />
              </div>
            </div>
          </fieldset>

          {/* Restrições */}
          <fieldset className="rounded-lg border border-stone-200 p-5 space-y-4">
            <legend className="text-sm font-semibold text-stone-700 px-1">Restrições</legend>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="firstOrderOnly">Apenas primeira compra</Label>
                <p className="text-xs text-stone-400">Cliente não pode ter pedidos anteriores</p>
              </div>
              <Switch
                id="firstOrderOnly"
                checked={firstOrderOnly}
                onCheckedChange={setFirstOrderOnly}
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Categorias elegíveis</Label>
                <p className="text-xs text-stone-400">
                  Deixe em branco para aplicar a todos os produtos. Se selecionar categorias, o
                  desconto é aplicado apenas nos itens dessas categorias.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
                        selectedCategories.includes(cat.id)
                          ? 'border-flor-400 bg-flor-50 text-flor-700'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      <span className="truncate">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </fieldset>

          {/* Status */}
          <fieldset className="rounded-lg border border-stone-200 p-5">
            <legend className="text-sm font-semibold text-stone-700 px-1">Status</legend>
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label htmlFor="isActive">Cupom ativo</Label>
                <p className="text-xs text-stone-400">Clientes podem usar este cupom</p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </fieldset>
        </div>

        {/* Preview — flex evita área vazia scrollável abaixo do aside */}
        <aside className="w-full shrink-0 space-y-4 lg:w-80 lg:sticky lg:top-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Preview para a cliente
            </p>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="font-mono font-semibold text-green-800">{code || 'CÓDIGO'}</p>
              <p className="text-sm text-green-700 mt-0.5">
                {previewDiscount}
                {previewMin}
                {previewUntil}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Salvando...' : mode === 'create' ? 'Criar cupom' : 'Salvar alterações'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}
