'use client';

import { useState, useCallback, useEffect } from 'react';
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
  // Estado de filtros
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
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
          minPrice,
          maxPrice,
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
    setPage(1);
    void fetchProducts(1, false);
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
    setPage(next);
    void fetchProducts(next, true);
  };

  const handlePriceChange = (min?: number, max?: number) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const clearAll = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSort('relevance');
  };

  // Chips dos filtros ativos
  const activeFilters = [
    ...selectedSizes.map((s) => ({
      label: `Tamanho ${s}`,
      onRemove: () => setSelectedSizes((prev) => prev.filter((x) => x !== s)),
    })),
    ...selectedColors.map((c) => ({
      label: c,
      onRemove: () => setSelectedColors((prev) => prev.filter((x) => x !== c)),
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
          minPrice={minPrice}
          maxPrice={maxPrice}
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
        minPrice={minPrice}
        maxPrice={maxPrice}
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
