'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useProducts, useProductStats, useCategories } from '@/hooks/use-products';
import { ProductsFilters } from './components/products-filters';
import { ProductsTable } from './components/products-table';
import { type ListProductsParams } from '@/lib/api/products';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-bege-200 rounded-md p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-serif font-medium text-flor-800 mt-1">{value}</p>
    </div>
  );
}

export default function ProdutosPage() {
  const [params, setParams] = useState<ListProductsParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: stats } = useProductStats();
  const { data: productsData, isLoading } = useProducts(params);
  const { data: categories = [] } = useCategories();

  const totalPages = productsData ? Math.ceil(productsData.total / (params.limit ?? 20)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-flor-800">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie o catálogo da loja</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 bg-flor-600 hover:bg-flor-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={16} />
          Novo produto
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Ativos" value={stats.active} />
          <StatCard label="Esgotados" value={stats.outOfStock} />
          <StatCard label="Inativos" value={stats.inactive} />
        </div>
      )}

      <div className="bg-white border border-bege-200 rounded-md p-6">
        <ProductsFilters params={params} categories={categories} onChange={setParams} />

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando...</div>
        ) : !productsData?.items.length ? (
          <div className="py-12 text-center text-muted-foreground">Nenhum produto encontrado.</div>
        ) : (
          <ProductsTable
            products={productsData.items}
            onBulkAction={() => setParams({ ...params })}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-bege-100">
            <p className="text-sm text-muted-foreground">{productsData?.total} produtos no total</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(params.page ?? 1) <= 1}
                onClick={() => setParams({ ...params, page: (params.page ?? 1) - 1 })}
              >
                Anterior
              </Button>
              <span className="text-sm px-3 py-1">
                {params.page ?? 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(params.page ?? 1) >= totalPages}
                onClick={() => setParams({ ...params, page: (params.page ?? 1) + 1 })}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
