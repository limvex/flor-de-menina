'use client';

import { useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultShipping,
  setDefaultBilling,
} from '@/lib/api/addresses';
import { getUserFacingErrorMessage } from '@/lib/errors';
import { AddressCard } from '@/components/loja/conta/address-card';
import { AddressForm } from '@/components/loja/conta/address-form';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Address, CreateAddressInput } from '@flor/types';

export default function EnderecosPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    staleTime: 30_000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const handleCreate = async (data: CreateAddressInput) => {
    setFormLoading(true);
    try {
      await createAddress(data);
      await refetch();
      toast.success('Endereço adicionado');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateAddressInput) => {
    if (!editingAddress) return;
    setFormLoading(true);
    try {
      await updateAddress(editingAddress.id, data);
      await refetch();
      toast.success('Endereço atualizado');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;
    try {
      await deleteAddress(removeId);
      await refetch();
      toast.success('Endereço removido');
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
    } finally {
      setRemoveId(null);
    }
  };

  const handleSetDefaultShipping = async (id: string) => {
    try {
      await setDefaultShipping(id);
      await refetch();
      toast.success('Endereço padrão de entrega atualizado');
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
    }
  };

  const handleSetDefaultBilling = async (id: string) => {
    try {
      await setDefaultBilling(id);
      await refetch();
      toast.success('Endereço padrão de cobrança atualizado');
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingAddress(undefined);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-xl text-flor-800">Endereços</h2>
        <button
          type="button"
          onClick={() => {
            setEditingAddress(undefined);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-flor-600 px-4 py-2 text-sm font-medium text-white hover:bg-flor-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo endereço
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhum endereço salvo"
          description="Adicione um endereço para agilizar seu próximo pedido."
          action={
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-flor-600 px-6 py-2.5 text-sm text-flor-600 hover:bg-flor-600 hover:text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar endereço
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleEdit}
              onRemove={(id) => setRemoveId(id)}
              onSetDefaultShipping={handleSetDefaultShipping}
              onSetDefaultBilling={handleSetDefaultBilling}
            />
          ))}
        </div>
      )}

      <AddressForm
        open={formOpen}
        onOpenChange={handleFormClose}
        initialData={editingAddress}
        onSubmit={editingAddress ? handleUpdate : handleCreate}
        loading={formLoading}
      />

      <AlertDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover endereço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
