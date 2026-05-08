'use client';

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stock: number;
  isActive: boolean;
}

interface Props {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  onOpenMeasureTable: () => void;
  hasMeasureTable: boolean;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  onOpenMeasureTable,
  hasMeasureTable,
}: Props) {
  const colors = Array.from(
    new Map(
      variants.filter((v) => v.color).map((v) => [v.color, { name: v.color!, hex: v.colorHex }]),
    ).values(),
  );

  const sizeOrder = ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'ÚNICO'];
  const rawSizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const sizes = rawSizes.sort((a, b) => {
    const ia = sizeOrder.indexOf(a);
    const ib = sizeOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedColor = selectedVariant?.color ?? null;
  const selectedSize = selectedVariant?.size ?? null;

  const findVariant = (color: string | null, size: string | null) =>
    variants.find((v) => v.color === color && v.size === size);

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-stone-800">
            Cor: <span className="text-stone-500">{selectedColor || 'Selecione'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const isAvailable = variants.some((v) => v.color === c.name && v.stock > 0);
              const isSelected = selectedColor === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    const v =
                      findVariant(c.name, selectedSize) ??
                      variants.find((vv) => vv.color === c.name);
                    if (v) onSelect(v.id);
                  }}
                  className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-stone-800 scale-110 shadow-md'
                      : 'border-stone-200 hover:border-stone-400'
                  } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ backgroundColor: c.hex ?? '#ccc' }}
                  aria-label={c.name}
                  title={c.name}
                  disabled={!isAvailable}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-stone-800">
              Tamanho: <span className="text-stone-500">{selectedSize || 'Selecione'}</span>
            </p>
            {hasMeasureTable && (
              <button
                type="button"
                onClick={onOpenMeasureTable}
                className="text-xs text-stone-600 underline hover:text-stone-900"
              >
                Tabela de medidas
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const v = findVariant(selectedColor, s) ?? variants.find((vv) => vv.size === s);
              const isAvailable = v ? v.stock > 0 : false;
              const isSelected = selectedSize === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const variant =
                      findVariant(selectedColor, s) ?? variants.find((vv) => vv.size === s);
                    if (variant && variant.stock > 0) onSelect(variant.id);
                  }}
                  disabled={!isAvailable}
                  className={`min-w-[3rem] rounded border px-3 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : isAvailable
                        ? 'border-stone-300 bg-white text-stone-800 hover:border-stone-600'
                        : 'border-stone-200 bg-stone-50 text-stone-400 line-through cursor-not-allowed'
                  }`}
                  aria-label={`Tamanho ${s}${!isAvailable ? ' esgotado' : ''}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
