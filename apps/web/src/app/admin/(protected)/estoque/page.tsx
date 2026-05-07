'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StockFilters } from '@/components/admin/stock/stock-filters';
import { StockListTable } from '@/components/admin/stock/stock-list-table';
import { Button } from '@/components/ui/button';
import { stockApi, type ListStockParams } from '@/lib/api/stock';
import { api } from '@/lib/api/client';
import type { ProductWithStockSummary } from '@flor/types';

interface CategoriesResult {
  id: string;
  name: string;
}

export default function EstoquePage() {
  const [params, setParams] = useState<ListStockParams>({ page: 1, pageSize: 30 });
  const [products, setProducts] = useState<ProductWithStockSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoriesResult[]>([]);

  useEffect(() => {
    api
      .get<CategoriesResult[]>('/admin/categories')
      .then(setCategories)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await stockApi.list(params);
      setProducts(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const pageSize = params.pageSize ?? 30;
  const page = params.page ?? 1;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Estoque" description="Gerencie o estoque de todas as variantes." />

      <StockFilters params={params} categories={categories} onChange={setParams} />

      {loading ? (
        <div className="rounded-xl border border-flor-100 py-16 text-center text-flor-400 text-sm">
          Carregando...
        </div>
      ) : (
        <StockListTable data={products} onRefresh={load} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">{total} produtos no total</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setParams({ ...params, page: page - 1 })}
            >
              Anterior
            </Button>
            <span className="text-sm px-3 py-1">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setParams({ ...params, page: page + 1 })}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
