'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Category } from '@/lib/api/categories';
import { type ListProductsParams } from '@/lib/api/products';

interface ProductsFiltersProps {
  params: ListProductsParams;
  categories: Category[];
  onChange: (params: ListProductsParams) => void;
}

export function ProductsFilters({ params, categories, onChange }: ProductsFiltersProps) {
  const [search, setSearch] = useState(params.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...params, search, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Input
        placeholder="Buscar por nome ou slug..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64"
      />

      <Select
        value={params.categoryId ?? 'all'}
        onValueChange={(v) =>
          onChange({ ...params, categoryId: v === 'all' ? undefined : (v ?? undefined), page: 1 })
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas categorias</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.status ?? 'all'}
        onValueChange={(v) =>
          onChange({ ...params, status: v as ListProductsParams['status'], page: 1 })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="inactive">Inativos</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={params.stock ?? 'all'}
        onValueChange={(v) =>
          onChange({ ...params, stock: v as ListProductsParams['stock'], page: 1 })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Estoque" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo estoque</SelectItem>
          <SelectItem value="available">Com estoque</SelectItem>
          <SelectItem value="out_of_stock">Esgotado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
