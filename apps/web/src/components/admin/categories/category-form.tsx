'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { SizeChart, CategoryAdminDto } from '@flor/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSection } from '@/components/admin/form-section';
import { SizeChartEditor } from './size-chart-editor';
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/app/admin/(protected)/categorias/actions';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
  slug: z.string().max(80, 'Máximo 80 caracteres').optional(),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  parentId: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0, 'Mínimo 0'),
  // z.custom to avoid input/output type mismatch from SizeChartSchema defaults
  sizeChart: z.custom<SizeChart | null | undefined>(),
});

type FormValues = z.infer<typeof schema>;

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: CategoryAdminDto;
  parentCategories: CategoryAdminDto[];
}

export function CategoryForm({ mode, initialData, parentCategories }: CategoryFormProps) {
  const router = useRouter();
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      slug: initialData?.slug ?? '',
      description: initialData?.description ?? '',
      parentId: initialData?.parentId ?? '',
      isActive: initialData?.isActive ?? true,
      sortOrder: initialData?.sortOrder ?? 0,
      sizeChart: initialData?.sizeChart ?? null,
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (!slugEdited && mode === 'create') {
      setValue('slug', slugify(nameValue));
    }
  }, [nameValue, slugEdited, mode, setValue]);

  const hasChildren = (initialData?._count?.children ?? 0) > 0;

  async function onSubmit(data: FormValues) {
    const payload = {
      name: data.name,
      slug: data.slug || undefined,
      description: data.description || undefined,
      parentId: data.parentId || null,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      sizeChart: data.sizeChart ?? null,
    };

    const result =
      mode === 'create'
        ? await createCategoryAction(payload)
        : await updateCategoryAction(initialData!.id, payload);

    if (!result.ok) {
      toast.error(result.error ?? 'Erro ao salvar categoria');
      return;
    }

    toast.success(mode === 'create' ? 'Categoria criada!' : 'Categoria atualizada!');
    router.push('/admin/categorias');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection title="Dados gerais">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-flor-700">
              Nome <span className="text-destructive">*</span>
            </label>
            <Input {...register('name')} placeholder="Ex: Vestidos" />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-flor-700">Slug</label>
            <Input
              {...register('slug')}
              placeholder="ex: vestidos"
              onChange={(e) => {
                setSlugEdited(true);
                register('slug').onChange(e);
              }}
            />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
            <p className="mt-1 text-xs text-flor-400">
              Gerado automaticamente a partir do nome se não preenchido.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-flor-700">Descrição</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Descrição opcional da categoria..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Hierarquia e ordenação">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-flor-700">Categoria pai</label>
            <select
              {...register('parentId')}
              disabled={hasChildren}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">— Categoria raiz —</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {hasChildren && (
              <p className="mt-1 text-xs text-flor-400">
                Categoria com subcategorias não pode ser movida.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-flor-700">
              Ordem de exibição
            </label>
            <Input
              type="number"
              min={0}
              {...register('sortOrder', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.sortOrder && (
              <p className="mt-1 text-xs text-destructive">{errors.sortOrder.message}</p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection title="Status">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={field.value}
                onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flor-600 ${
                  field.value ? 'bg-flor-600' : 'bg-flor-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow ring-0 transition-transform ${
                    field.value ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-flor-700">
                {field.value ? 'Ativa — visível na loja' : 'Inativa — oculta na loja'}
              </span>
            </div>
          )}
        />
      </FormSection>

      <FormSection
        title="Tabela de medidas"
        description="Configure uma tabela de medidas para orientar os clientes. Subcategorias herdam a tabela da categoria pai."
      >
        <Controller
          name="sizeChart"
          control={control}
          render={({ field }) => (
            <SizeChartEditor
              value={field.value}
              onChange={field.onChange}
              inherited={mode === 'edit' ? (initialData?.effectiveSizeChart ?? null) : null}
            />
          )}
        />
        {errors.sizeChart && (
          <p className="mt-2 text-xs text-destructive">{errors.sizeChart.message}</p>
        )}
      </FormSection>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/categorias')}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Salvando...'
            : mode === 'create'
              ? 'Criar categoria'
              : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}
