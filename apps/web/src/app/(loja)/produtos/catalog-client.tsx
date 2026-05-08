'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseAsArrayOf, parseAsString, parseAsInteger, parseAsFloat, useQueryStates } from 'nuqs';
import { ProductGrid } from '@/components/loja/product-grid';
import { ProductGridSkeleton } from '@/components/loja/product-skeleton';
import { EmptyState } from '@/components/loja/empty-state';
import { FiltersSidebar } from '@/components/loja/product-filters/filters-sidebar';
import { FiltersBottomSheet } from '@/components/loja/product-filters/filters-bottom-sheet';
import { FilterChips } from '@/components/loja/product-filters/filter-chips';
import { SortDropdown } from '@/components/loja/sort-dropdown';
import { ResultCount } from '@/components/loja/result-count';
import { LoadMoreButton } from '@/components/loja/load-more-button';
import { QuickViewModal } from '@/components/loja/quick-view-modal';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listPublicProducts, getPublicFacets } from '@/lib/api/products-public';
import type { PublicProduct, Facets } from '@/lib/api/products-public';
import { PRICE_RANGES } from '@/lib/catalog/price-ranges';

interface CatalogClientProps {
  initialCategorySlug?: string;
  initialSearch?: string;
}

const EMPTY_FACETS: Facets = { sizes: [], colors: [], priceMin: 0, priceMax: 1000 };

export function CatalogClient({ initialCategorySlug, initialSearch }: CatalogClientProps) {
  // Filtros sincronizados com a URL via nuqs
  const [filters, setFilters] = useQueryStates(
    {
      sizes: parseAsArrayOf(parseAsString).withDefault([]),
      colors: parseAsArrayOf(parseAsString).withDefault([]),
      minPrice: parseAsFloat,
      maxPrice: parseAsFloat,
      sort: parseAsString.withDefault('relevance'),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'replace' },
  );

  const { sizes: selectedSizes, colors: selectedColors, minPrice, maxPrice, sort, page } = filters;

  // Handlers que resetam para página 1 ao mudar filtros
  const setSelectedSizes = (v: string[]) => void setFilters({ sizes: v, page: 1 });
  const setSelectedColors = (v: string[]) => void setFilters({ colors: v, page: 1 });
  const handlePriceChange = (min?: number, max?: number) =>
    void setFilters({ minPrice: min ?? null, maxPrice: max ?? null, page: 1 });
  const setSort = (v: string) => void setFilters({ sort: v, page: 1 });

  // Estado de UI que não precisa ir pra URL
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Estado de dados
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [facets, setFacets] = useState<Facets>(EMPTY_FACETS);
  const [quickViewProduct, setQuickViewProduct] = useState<PublicProduct | null>(null);

  const fetchProducts = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await listPublicProducts({
          page: pageNum,
          limit: 24,
          search: initialSearch,
          categorySlug: initialCategorySlug,
          sizes: selectedSizes,
          colors: selectedColors,
          minPrice: minPrice ?? undefined,
          maxPrice: maxPrice ?? undefined,
          sort,
        });
        setProducts((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        // Silencioso — UI mostra estado vazio
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [initialSearch, initialCategorySlug, selectedSizes, selectedColors, minPrice, maxPrice, sort],
  );

  useEffect(() => {
    void fetchProducts(page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProducts]);

  useEffect(() => {
    getPublicFacets(initialCategorySlug)
      .then(setFacets)
      .catch(() => {
        setFacets(EMPTY_FACETS);
      });
  }, [initialCategorySlug]);

  const handleLoadMore = () => {
    const next = page + 1;
    void setFilters({ page: next });
    void fetchProducts(next, true);
  };

  const clearAll = () =>
    void setFilters({
      sizes: [],
      colors: [],
      minPrice: null,
      maxPrice: null,
      sort: 'relevance',
      page: 1,
    });

  // Chips dos filtros ativos
  const activeFilters = [
    ...selectedSizes.map((s) => ({
      label: `Tamanho ${s}`,
      onRemove: () => setSelectedSizes(selectedSizes.filter((x) => x !== s)),
    })),
    ...selectedColors.map((c) => ({
      label: c,
      onRemove: () => setSelectedColors(selectedColors.filter((x) => x !== c)),
    })),
    ...(minPrice != null || maxPrice != null
      ? [
          {
            label:
              PRICE_RANGES.find((r) => r.min === minPrice && r.max === maxPrice)?.label ??
              `R$${minPrice ?? 0} – R$${maxPrice ?? '∞'}`,
            onRemove: () => handlePriceChange(undefined, undefined),
          },
        ]
      : []),
  ];

  const handleQuickView = useCallback(
    (productId: string) => {
      const p = products.find((x) => x.id === productId) ?? null;
      setQuickViewProduct(p);
    },
    [products],
  );

  return (
    <div>
      {/* Barra mobile */}
      <div className="flex items-center justify-between gap-4 mb-6 lg:hidden">
        <ResultCount total={total} loading={loading} />
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar (desktop) */}
        <FiltersSidebar
          facets={facets}
          selectedSizes={selectedSizes}
          selectedColors={selectedColors}
          minPrice={minPrice ?? undefined}
          maxPrice={maxPrice ?? undefined}
          onSizesChange={setSelectedSizes}
          onColorsChange={setSelectedColors}
          onPriceChange={handlePriceChange}
          onClearAll={clearAll}
        />

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Barra desktop */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <ResultCount total={total} loading={loading} />
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          {/* Chips de filtros ativos */}
          {activeFilters.length > 0 && (
            <div className="mb-4">
              <FilterChips filters={activeFilters} onClearAll={clearAll} />
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState searchTerm={initialSearch} onClearFilters={clearAll} />
          ) : (
            <>
              <ProductGrid products={products} onQuickView={handleQuickView} />
              <LoadMoreButton
                onClick={handleLoadMore}
                loading={loadingMore}
                hasMore={page < totalPages}
              />
            </>
          )}
        </div>
      </div>

      {/* Bottom sheet mobile */}
      <FiltersBottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        facets={facets}
        selectedSizes={selectedSizes}
        selectedColors={selectedColors}
        minPrice={minPrice ?? undefined}
        maxPrice={maxPrice ?? undefined}
        total={total}
        onSizesChange={setSelectedSizes}
        onColorsChange={setSelectedColors}
        onPriceChange={handlePriceChange}
        onClearAll={clearAll}
      />

      {/* Modal de visualização rápida */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
