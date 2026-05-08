'use client';

import { X } from 'lucide-react';

interface ActiveFilter {
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  filters: ActiveFilter[];
  onClearAll: () => void;
}

export function FilterChips({ filters, onClearAll }: FilterChipsProps) {
  if (!filters.length) return null;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {filters.map((f, i) => (
        <button
          key={i}
          type="button"
          onClick={f.onRemove}
          className="flex items-center gap-1 px-3 py-1 rounded-full border border-stone-300 text-xs text-stone-700 hover:border-stone-900 transition-colors"
        >
          {f.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      {filters.length >= 2 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-stone-500 hover:text-stone-900 underline"
        >
          Limpar tudo
        </button>
      )}
    </div>
  );
}
