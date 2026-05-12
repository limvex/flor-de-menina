'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { institutionalPageFormSchema, type InstitutionalPageFormValues } from '@flor/types';
import { FormSection } from '@/components/admin/form-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TiptapEditor } from './tiptap-editor';
import { SeoPreview } from './seo-preview';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface PageFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<InstitutionalPageFormValues>;
  onSubmit: (data: InstitutionalPageFormValues) => Promise<void>;
  onCancelHref: string;
}

export function PageForm({ mode, defaultValues, onSubmit, onCancelHref }: PageFormProps) {
  const mergedDefaults = useMemo<InstitutionalPageFormValues>(
    () => ({
      slug: defaultValues?.slug ?? '',
      title: defaultValues?.title ?? '',
      content: defaultValues?.content ?? '<p></p>',
      metaTitle: defaultValues?.metaTitle ?? '',
      metaDescription: defaultValues?.metaDescription ?? '',
      ogImage: defaultValues?.ogImage ?? '',
      isActive: defaultValues?.isActive ?? true,
      sortOrder: defaultValues?.sortOrder ?? 0,
    }),
    [defaultValues],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionalPageFormValues>({
    resolver: zodResolver(institutionalPageFormSchema),
    defaultValues: mergedDefaults,
  });

  useEffect(() => {
    reset(mergedDefaults);
  }, [mergedDefaults, reset]);

  const title = watch('title');
  const slug = watch('slug');
  const metaTitle = watch('metaTitle') ?? '';
  const metaDescription = watch('metaDescription') ?? '';
  const previewTitle = (metaTitle || title || '').slice(0, 70);
  const previewDesc = (metaDescription || '').slice(0, 160);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <FormSection title="Conteúdo">
        <div className="space-y-4">
          <div>
            <Label htmlFor="page-title">Título</Label>
            <Input
              id="page-title"
              className="mt-1.5"
              {...register('title')}
              onBlur={(e) => {
                if (mode === 'create' && !getValues('slug')) {
                  setValue('slug', slugify(e.target.value), { shouldValidate: true });
                }
              }}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="page-slug">Slug (URL)</Label>
            <Input id="page-slug" className="mt-1.5 font-mono text-sm" {...register('slug')} />
            <p className="text-xs text-flor-500 mt-1">
              URL pública: <span className="text-flor-700">flordemenina.store/p/{slug || '…'}</span>
            </p>
            {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>}
          </div>
          <div>
            <Label>Corpo da página</Label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
            {errors.content && (
              <p className="text-xs text-red-600 mt-1">{errors.content.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="SEO"
        description="Deixe em branco para usar os valores padrão (título da página e trecho automático)."
      >
        <div className="space-y-4">
          <div>
            <div className="flex justify-between gap-2">
              <Label htmlFor="meta-title">Meta título</Label>
              <span className="text-xs text-flor-400">{metaTitle.length}/70</span>
            </div>
            <Input id="meta-title" maxLength={70} className="mt-1.5" {...register('metaTitle')} />
            {errors.metaTitle && (
              <p className="text-xs text-red-600 mt-1">{errors.metaTitle.message}</p>
            )}
          </div>
          <div>
            <div className="flex justify-between gap-2">
              <Label htmlFor="meta-desc">Meta descrição</Label>
              <span className="text-xs text-flor-400">{metaDescription.length}/160</span>
            </div>
            <Textarea
              id="meta-desc"
              maxLength={160}
              rows={3}
              className="mt-1.5 resize-y min-h-[72px]"
              {...register('metaDescription')}
            />
            {errors.metaDescription && (
              <p className="text-xs text-red-600 mt-1">{errors.metaDescription.message}</p>
            )}
          </div>
          <SeoPreview title={previewTitle} description={previewDesc} />
          <div>
            <Label htmlFor="og-image">Imagem Open Graph (URL absoluta)</Label>
            <Input
              id="og-image"
              className="mt-1.5"
              placeholder="https://..."
              {...register('ogImage')}
            />
            {errors.ogImage && (
              <p className="text-xs text-red-600 mt-1">{errors.ogImage.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Configurações">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-3">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="page-active" />
              )}
            />
            <Label htmlFor="page-active" className="cursor-pointer">
              Página ativa na loja
            </Label>
          </div>
          <div className="flex-1 max-w-[200px]">
            <Label htmlFor="sort-order">Ordem de exibição</Label>
            <Input
              id="sort-order"
              type="number"
              className="mt-1.5"
              {...register('sortOrder', { valueAsNumber: true })}
            />
            {errors.sortOrder && (
              <p className="text-xs text-red-600 mt-1">{errors.sortOrder.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          render={<Link href={onCancelHref} />}
          nativeButton={false}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
