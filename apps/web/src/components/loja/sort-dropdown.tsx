'use client';

import { SORT_OPTIONS } from '@/lib/catalog/sort-options';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-stone-500 whitespace-nowrap">
        Ordenar por
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-stone-200 rounded px-2 py-1.5 text-stone-700 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
