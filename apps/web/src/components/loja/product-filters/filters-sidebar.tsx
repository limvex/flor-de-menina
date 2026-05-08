import { SizeFilter } from './size-filter';
import { ColorFilter } from './color-filter';
import { PriceFilter } from './price-filter';
import { Separator } from '@/components/ui/separator';
import type { Facets } from '@/lib/api/products-public';

interface FiltersSidebarProps {
  facets: Facets;
  selectedSizes: string[];
  selectedColors: string[];
  minPrice?: number;
  maxPrice?: number;
  onSizesChange: (v: string[]) => void;
  onColorsChange: (v: string[]) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onClearAll: () => void;
}

export function FiltersSidebar({
  facets,
  selectedSizes,
  selectedColors,
  minPrice,
  maxPrice,
  onSizesChange,
  onColorsChange,
  onPriceChange,
  onClearAll,
}: FiltersSidebarProps) {
  const hasActiveFilters =
    selectedSizes.length > 0 || selectedColors.length > 0 || minPrice != null || maxPrice != null;

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-stone-900">Filtros</h3>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-stone-500 hover:text-stone-900 underline"
            >
              Limpar tudo
            </button>
          )}
        </div>
        <Separator />
        <SizeFilter sizes={facets.sizes} selected={selectedSizes} onChange={onSizesChange} />
        {facets.sizes.length > 0 && <Separator />}
        <ColorFilter colors={facets.colors} selected={selectedColors} onChange={onColorsChange} />
        {facets.colors.length > 0 && <Separator />}
        <PriceFilter minPrice={minPrice} maxPrice={maxPrice} onChangeFn={onPriceChange} />
      </div>
    </aside>
  );
}
