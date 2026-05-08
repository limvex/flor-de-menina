'use client';

interface SizeFilterProps {
  sizes: string[];
  selected: string[];
  onChange: (sizes: string[]) => void;
}

export function SizeFilter({ sizes, selected, onChange }: SizeFilterProps) {
  const toggle = (size: string) => {
    onChange(selected.includes(size) ? selected.filter((s) => s !== size) : [...selected, size]);
  };

  if (!sizes.length) return null;

  return (
    <div>
      <h4 className="text-sm font-medium text-stone-900 mb-3">Tamanho</h4>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => toggle(size)}
            className={`px-3 py-1.5 text-xs border rounded transition-colors ${
              selected.includes(size)
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 text-stone-700 hover:border-stone-400'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
