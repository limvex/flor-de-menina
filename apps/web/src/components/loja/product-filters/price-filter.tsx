'use client';

import { useState } from 'react';
import { PRICE_RANGES } from '@/lib/catalog/price-ranges';

interface PriceFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onChangeFn: (min?: number, max?: number) => void;
}

export function PriceFilter({ minPrice, maxPrice, onChangeFn }: PriceFilterProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customMin, setCustomMin] = useState(minPrice?.toString() ?? '');
  const [customMax, setCustomMax] = useState(maxPrice?.toString() ?? '');

  const selectedRange = PRICE_RANGES.find((r) => r.min === minPrice && r.max === maxPrice);

  return (
    <div>
      <h4 className="text-sm font-medium text-stone-900 mb-3">Preço</h4>
      <div className="space-y-2">
        {PRICE_RANGES.map((range, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              onChangeFn(range.min, range.max ?? undefined);
              setCustomMode(false);
            }}
            className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
              !customMode && selectedRange === range
                ? 'bg-stone-900 text-white'
                : 'text-stone-700 hover:bg-stone-50'
            }`}
          >
            {range.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomMode(!customMode)}
          className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
            customMode ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'
          }`}
        >
          Personalizar
        </button>
        {customMode && (
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              placeholder="Mín"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              onBlur={() =>
                onChangeFn(
                  customMin ? Number(customMin) : undefined,
                  customMax ? Number(customMax) : undefined,
                )
              }
              className="w-full border border-stone-200 rounded px-2 py-1.5 text-sm text-stone-700"
            />
            <input
              type="number"
              placeholder="Máx"
              value={customMax}
              onChange={(e) => setCustomMax(e.target.value)}
              onBlur={() =>
                onChangeFn(
                  customMin ? Number(customMin) : undefined,
                  customMax ? Number(customMax) : undefined,
                )
              }
              className="w-full border border-stone-200 rounded px-2 py-1.5 text-sm text-stone-700"
            />
          </div>
        )}
        {(minPrice != null || maxPrice != null) && (
          <button
            type="button"
            onClick={() => {
              onChangeFn(undefined, undefined);
              setCustomMode(false);
            }}
            className="text-xs text-stone-500 hover:text-stone-900 underline"
          >
            Limpar preço
          </button>
        )}
      </div>
    </div>
  );
}
