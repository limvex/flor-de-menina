'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SizeFilter } from './size-filter';
import { ColorFilter } from './color-filter';
import { PriceFilter } from './price-filter';
import { Separator } from '@/components/ui/separator';
import type { Facets } from '@/lib/api/products-public';

interface FiltersBottomSheetProps {
  open: boolean;
  onClose: () => void;
  facets: Facets;
  selectedSizes: string[];
  selectedColors: string[];
  minPrice?: number;
  maxPrice?: number;
  total: number;
  onSizesChange: (v: string[]) => void;
  onColorsChange: (v: string[]) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onClearAll: () => void;
}

export function FiltersBottomSheet({
  open,
  onClose,
  facets,
  selectedSizes,
  selectedColors,
  minPrice,
  maxPrice,
  total,
  onSizesChange,
  onColorsChange,
  onPriceChange,
  onClearAll,
}: FiltersBottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="font-serif">Filtros</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <SizeFilter sizes={facets.sizes} selected={selectedSizes} onChange={onSizesChange} />
          <Separator />
          <ColorFilter colors={facets.colors} selected={selectedColors} onChange={onColorsChange} />
          <Separator />
          <PriceFilter minPrice={minPrice} maxPrice={maxPrice} onChangeFn={onPriceChange} />
        </div>
        <div className="shrink-0 flex gap-3 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClearAll}>
            Limpar
          </Button>
          <Button className="flex-1 bg-stone-900 hover:bg-stone-700" onClick={onClose}>
            Ver {total.toLocaleString('pt-BR')} produtos
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
