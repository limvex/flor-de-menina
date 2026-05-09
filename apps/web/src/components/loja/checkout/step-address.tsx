'use client';

import { useState } from 'react';
import { MapPin, Plus, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AddressForm } from '@/components/loja/conta/address-form';
import { cn } from '@/lib/utils';
import { getAddresses, createAddress } from '@/lib/api/addresses';
import { useCheckout } from '@/contexts/checkout-context';
import type { Address, CreateAddressInput } from '@flor/types';

export function StepAddress() {
  const { state, setAddress } = useCheckout();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(state.address?.addressId ?? null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    staleTime: 30_000,
  });

  const handleCreate = async (data: CreateAddressInput) => {
    setFormLoading(true);
    try {
      const created = await createAddress(data);
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelected(created.id);
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar endereço');
    } finally {
      setFormLoading(false);
    }
  };

  const handleContinue = () => {
    const addr = addresses.find((a: Address) => a.id === selected);
    if (!addr) return;
    setAddress({
      addressId: addr.id,
      snapshot: addr,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl font-normal text-flor-800">Endereço de entrega</h2>

      {addresses.length === 0 && !formOpen && (
        <div className="rounded-lg border border-dashed border-flor-200 p-8 text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-flor-300" />
          <p className="text-sm text-flor-500">Nenhum endereço cadastrado ainda.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-flor-300 text-flor-700"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar endereço
          </Button>
        </div>
      )}

      {addresses.length > 0 && (
        <ul className="space-y-3" role="radiogroup" aria-label="Endereços">
          {addresses.map((addr: Address) => (
            <li key={addr.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected === addr.id}
                onClick={() => setSelected(addr.id)}
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition-colors',
                  selected === addr.id
                    ? 'border-flor-800 bg-flor-50'
                    : 'border-flor-200 bg-white hover:border-flor-400',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    {addr.label && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-flor-500">
                        {addr.label}
                      </p>
                    )}
                    <p className="text-sm font-medium text-flor-800">{addr.recipientName}</p>
                    <p className="text-sm text-flor-600">
                      {addr.street}, {addr.number}
                      {addr.complement ? `, ${addr.complement}` : ''} — {addr.neighborhood}
                    </p>
                    <p className="text-sm text-flor-600">
                      {addr.city}/{addr.state} — CEP {addr.zipCode}
                    </p>
                  </div>
                  {selected === addr.id && (
                    <Check
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-flor-800"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {addresses.length > 0 && !formOpen && (
        <Button
          type="button"
          variant="ghost"
          className="text-flor-600 hover:text-flor-800"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Usar outro endereço
        </Button>
      )}

      {formOpen && (
        <AddressForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleCreate}
          loading={formLoading}
        />
      )}

      {selected && (
        <Button
          type="button"
          className="w-full bg-flor-800 hover:bg-flor-700 text-white"
          onClick={handleContinue}
        >
          Continuar
        </Button>
      )}
    </div>
  );
}
