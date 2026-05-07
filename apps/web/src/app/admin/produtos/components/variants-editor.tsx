'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { type ProductVariant } from '@/lib/api/products';

type VariantInput = Partial<ProductVariant> & { stock: number };

interface VariantsEditorProps {
  variants: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
}

export function VariantsEditor({ variants, onChange }: VariantsEditorProps) {
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const addVariant = () => {
    if (!newSize && !newColor) return;
    const newVariant: VariantInput = {
      size: newSize || undefined,
      color: newColor || undefined,
      colorHex: newColor ? newColorHex : undefined,
      stock: 0,
      isActive: true,
    };
    onChange([...variants, newVariant]);
    setNewSize('');
    setNewColor('');
  };

  const update = (index: number, field: keyof VariantInput, value: unknown) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bege-200">
              <th className="text-left py-2 pr-4 font-medium text-flor-700">Tamanho</th>
              <th className="text-left py-2 pr-4 font-medium text-flor-700">Cor</th>
              <th className="text-left py-2 pr-4 font-medium text-flor-700">SKU</th>
              <th className="text-left py-2 pr-4 font-medium text-flor-700">Preço (R$)</th>
              <th className="text-left py-2 pr-4 font-medium text-flor-700">Estoque</th>
              <th className="text-left py-2 pr-4 font-medium text-flor-700">Ativo</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-bege-100">
            {variants.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-muted-foreground">
                  Nenhuma variação. Adicione abaixo.
                </td>
              </tr>
            )}
            {variants.map((v, i) => (
              <tr key={i}>
                <td className="py-2 pr-3">
                  <Input
                    value={v.size ?? ''}
                    onChange={(e) => update(i, 'size', e.target.value)}
                    placeholder="P, M, G..."
                    className="h-8 w-24"
                  />
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-1">
                    {v.colorHex && (
                      <span
                        className="w-5 h-5 rounded-full border border-bege-200 flex-shrink-0"
                        style={{ background: v.colorHex }}
                      />
                    )}
                    <Input
                      value={v.color ?? ''}
                      onChange={(e) => update(i, 'color', e.target.value)}
                      placeholder="Cor"
                      className="h-8 w-28"
                    />
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <Input
                    value={v.sku ?? ''}
                    onChange={(e) => update(i, 'sku', e.target.value)}
                    placeholder="Auto"
                    className="h-8 w-28"
                  />
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    value={v.price ?? ''}
                    onChange={(e) =>
                      update(i, 'price', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Padrão"
                    className="h-8 w-24"
                    min={0}
                    step={0.01}
                  />
                </td>
                <td className="py-2 pr-3">
                  <Input
                    type="number"
                    value={v.stock}
                    onChange={(e) => update(i, 'stock', parseInt(e.target.value, 10) || 0)}
                    className="h-8 w-20"
                    min={0}
                  />
                </td>
                <td className="py-2 pr-3">
                  <Switch
                    checked={v.isActive ?? true}
                    onCheckedChange={(checked) => update(i, 'isActive', checked)}
                  />
                </td>
                <td className="py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => remove(i)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-bege-100">
        <div>
          <Label className="text-xs">Tamanho</Label>
          <Input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="P, M, G, GG..."
            className="h-8 w-28 mt-1"
            onKeyDown={(e) => e.key === 'Enter' && addVariant()}
          />
        </div>
        <div>
          <Label className="text-xs">Cor</Label>
          <Input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="Preto, Branco..."
            className="h-8 w-32 mt-1"
            onKeyDown={(e) => e.key === 'Enter' && addVariant()}
          />
        </div>
        <div>
          <Label className="text-xs">Hex</Label>
          <input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="h-8 w-12 mt-1 cursor-pointer rounded border border-bege-200 p-0.5"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addVariant} className="h-8">
          <Plus size={14} className="mr-1" />
          Adicionar variação
        </Button>
      </div>
    </div>
  );
}
