'use client';

import { MoreHorizontal, Truck, CreditCard, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Address } from '@flor/types';

interface Props {
  address: Address;
  onEdit: (address: Address) => void;
  onRemove: (id: string) => void;
  onSetDefaultShipping: (id: string) => void;
  onSetDefaultBilling: (id: string) => void;
}

export function AddressCard({
  address,
  onEdit,
  onRemove,
  onSetDefaultShipping,
  onSetDefaultBilling,
}: Props) {
  const title = address.label ?? `Endereço`;

  return (
    <div className="relative rounded-lg border border-stone-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-stone-900">{title}</p>
          <p className="text-xs text-stone-500 mt-0.5">{address.recipientName}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded p-1 hover:bg-stone-100 transition-colors"
            aria-label="Opções do endereço"
          >
            <MoreHorizontal className="h-4 w-4 text-stone-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => onEdit(address)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetDefaultShipping(address.id)}>
              <Truck className="mr-2 h-4 w-4" />
              Padrão de entrega
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSetDefaultBilling(address.id)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Padrão de cobrança
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRemove(address.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-stone-700">
        {address.street}, {address.number}
        {address.complement && `, ${address.complement}`}
      </p>
      <p className="text-sm text-stone-600">
        {address.neighborhood} — {address.city}/{address.state}
      </p>
      <p className="text-sm text-stone-500">{address.zipCode}</p>

      {(address.isDefaultShipping || address.isDefaultBilling) && (
        <div className="flex gap-2 flex-wrap pt-1">
          {address.isDefaultShipping && (
            <Badge variant="outline" className="text-xs border-flor-300 text-flor-700 bg-flor-50">
              <Truck className="mr-1 h-3 w-3" />
              Entrega padrão
            </Badge>
          )}
          {address.isDefaultBilling && (
            <Badge variant="outline" className="text-xs border-stone-300 text-stone-600">
              <CreditCard className="mr-1 h-3 w-3" />
              Cobrança padrão
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
