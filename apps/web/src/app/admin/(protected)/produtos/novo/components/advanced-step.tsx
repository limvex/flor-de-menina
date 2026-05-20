'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Control, Controller, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { type NewProductFormData } from './new-product-schema';

interface AdvancedStepProps {
  register: UseFormRegister<NewProductFormData>;
  control: Control<NewProductFormData>;
  seoTitleLength: number;
  seoDescriptionLength: number;
}

export function AdvancedStep({
  register,
  control,
  seoTitleLength,
  seoDescriptionLength,
}: AdvancedStepProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-lg border border-bege-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 sm:p-6 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="font-serif text-lg text-flor-800">Avançado</h2>
          {!open && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Toque para ver peso, dimensões, slug e SEO (opcional)
            </p>
          )}
        </div>
        <ChevronDown
          size={20}
          className={cn(
            'shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'border-t border-bege-100 px-5 pb-5 sm:px-6 sm:pb-6 pt-4 space-y-4',
          !open && 'hidden',
        )}
        aria-hidden={!open}
      >
        <p className="text-sm text-muted-foreground">
          Estes campos são opcionais. Se não preencher, usaremos valores padrão.
        </p>

        <div className="flex items-center justify-between gap-4">
          <Label>Produto ativo</Label>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label>Destaque na home</Label>
          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>

        <div>
          <Label htmlFor="weight">Peso (gramas)</Label>
          <Input
            id="weight"
            {...register('weight', { valueAsNumber: true })}
            type="number"
            min={0}
            className="mt-1.5"
            placeholder="500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div>
            <Label className="text-xs">Largura (cm)</Label>
            <Input
              {...register('width', { valueAsNumber: true })}
              type="number"
              min={0}
              className="mt-1 h-9"
              placeholder="—"
            />
          </div>
          <div>
            <Label className="text-xs">Altura (cm)</Label>
            <Input
              {...register('height', { valueAsNumber: true })}
              type="number"
              min={0}
              className="mt-1 h-9"
              placeholder="—"
            />
          </div>
          <div>
            <Label className="text-xs">Comprimento (cm)</Label>
            <Input
              {...register('productLength', { valueAsNumber: true })}
              type="number"
              min={0}
              className="mt-1 h-9"
              placeholder="—"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...register('slug')}
            className="mt-1.5"
            placeholder="gerado automaticamente"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="seoTitle">Meta título</Label>
            <span className="text-xs text-muted-foreground">{seoTitleLength}/60</span>
          </div>
          <Input id="seoTitle" {...register('seoTitle')} className="mt-1.5" maxLength={60} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="seoDescription">Meta descrição</Label>
            <span className="text-xs text-muted-foreground">{seoDescriptionLength}/160</span>
          </div>
          <Textarea
            id="seoDescription"
            {...register('seoDescription')}
            className="mt-1.5 min-h-[80px]"
            maxLength={160}
          />
        </div>
      </div>
    </section>
  );
}
