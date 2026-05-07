'use client';

import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ListStockParams, StockStatusFilter, StockSortField } from '@/lib/api/stock';

interface Category {
  id: string;
  name: string;
}

interface StockFiltersProps {
  params: ListStockParams;
  categories: Category[];
  onChange: (p: ListStockParams) => void;
}

export function StockFilters({ params, categories, onChange }: StockFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(params.search ?? '');

  const onSearchChange = useCallback(
    (v: string) => {
      setSearchDraft(v);
      const timer = setTimeout(() => onChange({ ...params, search: v || undefined, page: 1 }), 300);
      return () => clearTimeout(timer);
    },
    [params, onChange],
  );

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-flor-400" />
        <Input
          placeholder="Buscar produto..."
          className="pl-9"
          value={searchDraft}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select
        value={params.categoryId ?? ''}
        onValueChange={(v) => onChange({ ...params, categoryId: v || undefined, page: 1 })}
      >
        <SelectTrigger className="w-44">
          <SelectValue>
            {params.categoryId
              ? (categories.find((c) => c.id === params.categoryId)?.name ?? 'Todas as categorias')
              : 'Todas as categorias'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas as categorias</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.status ?? ''}
        onValueChange={(v) =>
          onChange({ ...params, status: v ? (v as StockStatusFilter) : undefined, page: 1 })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue>
            {params.status === 'ok'
              ? 'OK'
              : params.status === 'low'
                ? 'Estoque baixo'
                : params.status === 'out'
                  ? 'Esgotado'
                  : 'Todos os status'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos os status</SelectItem>
          <SelectItem value="ok">OK</SelectItem>
          <SelectItem value="low">Estoque baixo</SelectItem>
          <SelectItem value="out">Esgotado</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={params.sort ?? 'updated'}
        onValueChange={(v) => onChange({ ...params, sort: v as StockSortField })}
      >
        <SelectTrigger className="w-44">
          <SelectValue>
            {params.sort === 'name'
              ? 'Nome'
              : params.sort === 'stock'
                ? 'Estoque'
                : 'Última atualização'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Nome</SelectItem>
          <SelectItem value="stock">Estoque</SelectItem>
          <SelectItem value="updated">Última atualização</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
