'use client';

import { useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { lookupCep } from '@/lib/api/addresses';
import type { Address, CreateAddressInput } from '@flor/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Address;
  onSubmit: (data: CreateAddressInput) => Promise<void>;
  loading?: boolean;
}

export function AddressForm({ open, onOpenChange, initialData, onSubmit, loading }: Props) {
  const [form, setForm] = useState<CreateAddressInput>({
    label: initialData?.label ?? '',
    recipientName: initialData?.recipientName ?? '',
    zipCode: initialData?.zipCode ?? '',
    street: initialData?.street ?? '',
    number: initialData?.number ?? '',
    complement: initialData?.complement ?? '',
    neighborhood: initialData?.neighborhood ?? '',
    city: initialData?.city ?? '',
    state: initialData?.state ?? '',
    isDefaultShipping: initialData?.isDefaultShipping ?? false,
    isDefaultBilling: initialData?.isDefaultBilling ?? false,
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [error, setError] = useState('');

  const handleCepBlur = useCallback(async () => {
    const digits = form.zipCode.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepError('');
    const result = await lookupCep(digits);
    setCepLoading(false);
    if (!result) {
      setCepError('CEP não encontrado. Preencha o endereço manualmente.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      street: result.street || prev.street,
      neighborhood: result.neighborhood || prev.neighborhood,
      city: result.city || prev.city,
      state: result.state || prev.state,
    }));
  }, [form.zipCode]);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar endereço');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:!max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="font-serif text-lg font-normal text-flor-800">
            {initialData ? 'Editar endereço' : 'Novo endereço'}
          </SheetTitle>
        </SheetHeader>

        <Separator />

        <form
          id="address-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Identificação */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-label">
              Identificação <span className="text-stone-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="addr-label"
              placeholder="Casa, Trabalho..."
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              maxLength={30}
            />
          </div>

          {/* Destinatário */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-recipient">
              Destinatário{' '}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="addr-recipient"
              required
              aria-required
              value={form.recipientName}
              onChange={(e) => setForm((p) => ({ ...p, recipientName: e.target.value }))}
            />
          </div>

          {/* CEP */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-cep">
              CEP{' '}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </Label>
            <div className="relative">
              <Input
                id="addr-cep"
                required
                aria-required
                value={form.zipCode}
                onChange={(e) => setForm((p) => ({ ...p, zipCode: formatCep(e.target.value) }))}
                onBlur={handleCepBlur}
                placeholder="00000-000"
                aria-describedby={cepError ? 'cep-error' : undefined}
                className={cepLoading ? 'pr-24' : ''}
              />
              {cepLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 animate-pulse">
                  Buscando…
                </span>
              )}
            </div>
            {cepError && (
              <p id="cep-error" className="text-xs text-amber-600" role="alert">
                {cepError}
              </p>
            )}
          </div>

          {/* Rua */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-street">
              Rua{' '}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="addr-street"
              required
              value={form.street}
              onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
            />
          </div>

          {/* Número + Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="addr-number">
                Número{' '}
                <span className="text-red-500" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="addr-number"
                required
                value={form.number}
                onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-complement">Complemento</Label>
              <Input
                id="addr-complement"
                value={form.complement}
                onChange={(e) => setForm((p) => ({ ...p, complement: e.target.value }))}
                placeholder="Apto, bloco…"
              />
            </div>
          </div>

          {/* Bairro + Cidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="addr-neighborhood">
                Bairro{' '}
                <span className="text-red-500" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="addr-neighborhood"
                required
                value={form.neighborhood}
                onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-city">
                Cidade{' '}
                <span className="text-red-500" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="addr-city"
                required
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-1.5 max-w-[120px]">
            <Label htmlFor="addr-state">
              Estado{' '}
              <span className="text-red-500" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="addr-state"
              required
              value={form.state}
              onChange={(e) =>
                setForm((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))
              }
              maxLength={2}
              placeholder="AL"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="default-shipping"
                checked={form.isDefaultShipping}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isDefaultShipping: !!v }))}
              />
              <Label htmlFor="default-shipping" className="font-normal cursor-pointer">
                Usar como endereço padrão de entrega
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="default-billing"
                checked={form.isDefaultBilling}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isDefaultBilling: !!v }))}
              />
              <Label htmlFor="default-billing" className="font-normal cursor-pointer">
                Usar como endereço padrão de cobrança
              </Label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </form>

        <Separator />

        <SheetFooter className="px-6 py-4 flex-row gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="address-form"
            disabled={loading || cepLoading}
            className="flex-1 rounded-full bg-flor-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-flor-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Salvando…' : 'Salvar'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
