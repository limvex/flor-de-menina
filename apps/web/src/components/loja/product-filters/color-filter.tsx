'use client';

import * as Tooltip from '@radix-ui/react-tooltip';

interface ColorFilterProps {
  colors: { name: string; hex: string }[];
  selected: string[];
  onChange: (colors: string[]) => void;
}

export function ColorFilter({ colors, selected, onChange }: ColorFilterProps) {
  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((c) => c !== name) : [...selected, name]);
  };

  if (!colors.length) return null;

  return (
    <div>
      <h4 className="text-sm font-medium text-stone-900 mb-3">Cor</h4>
      <Tooltip.Provider>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <Tooltip.Root key={color.name}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => toggle(color.name)}
                  aria-label={color.name}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    selected.includes(color.name)
                      ? 'border-stone-900 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              </Tooltip.Trigger>
              <Tooltip.Content
                side="top"
                className="bg-stone-900 text-white text-xs px-2 py-1 rounded"
              >
                {color.name}
                <Tooltip.Arrow className="fill-stone-900" />
              </Tooltip.Content>
            </Tooltip.Root>
          ))}
        </div>
      </Tooltip.Provider>
    </div>
  );
}
