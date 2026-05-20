'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type ProductVariant } from '@/lib/api/products';

export type VariantDraft = Partial<ProductVariant> & { stock: number };

const PRESET_SIZES = ['P', 'M', 'G', 'GG', 'Único'] as const;
const CUSTOM_SIZE = '__custom__';
const NO_SIZE = '';

interface VariationsStepProps {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

export function VariationsStep({ variants, onChange }: VariationsStepProps) {
  const [draftSizeMode, setDraftSizeMode] = useState(NO_SIZE);
  const [draftCustomSize, setDraftCustomSize] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [draftStock, setDraftStock] = useState('');
  const [stockError, setStockError] = useState<string | null>(null);

  const resolvedDraftSize = draftSizeMode === CUSTOM_SIZE ? draftCustomSize.trim() : draftSizeMode;

  const sizeSelectLabel =
    draftSizeMode === CUSTOM_SIZE
      ? draftCustomSize.trim() || 'Outro tamanho'
      : draftSizeMode || undefined;

  const addVariant = () => {
    const size = resolvedDraftSize.trim();
    const color = draftColor.trim();
    const stockTrim = draftStock.trim();

    if (!size && !color) return;

    if (!stockTrim) {
      setStockError('Informe a quantidade em estoque');
      return;
    }

    const stock = parseInt(stockTrim, 10);
    if (Number.isNaN(stock) || stock < 0) {
      setStockError('Informe a quantidade em estoque');
      return;
    }

    setStockError(null);
    onChange([
      ...variants,
      {
        size: size || undefined,
        color: color || undefined,
        stock,
        isActive: true,
      },
    ]);

    setDraftSizeMode(NO_SIZE);
    setDraftCustomSize('');
    setDraftColor('');
    setDraftStock('');
  };

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    const next = [...variants];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <section className="space-y-4 rounded-lg border border-bege-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="font-serif text-lg text-flor-800">Variações</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione cada combinação de tamanho e cor que você tem em estoque. Pode salvar sem
          variações e incluir depois.
        </p>
      </div>

      {variants.length > 0 && (
        <ul className="space-y-3">
          {variants.map((v, index) => (
            <li
              key={index}
              className="rounded-md border border-bege-100 bg-flor-50/40 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-flor-800">Variação {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeVariant(index)}
                  aria-label="Remover variação"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Tamanho</Label>
                  <Input
                    value={v.size ?? ''}
                    onChange={(e) => updateVariant(index, { size: e.target.value || undefined })}
                    placeholder="P, M, G…"
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cor</Label>
                  <Input
                    value={v.color ?? ''}
                    onChange={(e) => updateVariant(index, { color: e.target.value || undefined })}
                    placeholder="Verde, Preto…"
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantidade em estoque</Label>
                  <Input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) =>
                      updateVariant(index, { stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="mt-1 h-9"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-dashed border-bege-200 p-4 space-y-3">
        <p className="text-sm font-medium text-flor-700">Nova variação</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Tamanho</Label>
            <Select value={draftSizeMode} onValueChange={(v) => setDraftSizeMode(v ?? NO_SIZE)}>
              <SelectTrigger className="mt-1 h-9 w-full">
                <SelectValue placeholder="Escolher tamanho">{sizeSelectLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRESET_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_SIZE}>Outro tamanho…</SelectItem>
              </SelectContent>
            </Select>
            {draftSizeMode === CUSTOM_SIZE && (
              <Input
                value={draftCustomSize}
                onChange={(e) => setDraftCustomSize(e.target.value)}
                placeholder="Ex: 38, 40…"
                className="mt-2 h-9"
              />
            )}
          </div>
          <div>
            <Label className="text-xs">Cor</Label>
            <Input
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              placeholder="Verde, Preto, Rosa…"
              className="mt-1 h-9"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Quantidade em estoque</Label>
            <Input
              type="number"
              min={0}
              value={draftStock}
              onChange={(e) => {
                setDraftStock(e.target.value);
                if (stockError) setStockError(null);
              }}
              placeholder="Ex: 5"
              className="mt-1 h-9 max-w-[8rem]"
            />
            {stockError && <p className="text-xs text-destructive mt-1">{stockError}</p>}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto border-flor-300 text-flor-700 hover:bg-flor-50"
          onClick={addVariant}
        >
          <Plus size={16} className="mr-2" />
          Adicionar variação
        </Button>
      </div>
    </section>
  );
}
