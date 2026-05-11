'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/errors';
import { type Product, type ProductVariant } from '@/lib/api/products';
import { type Category } from '@/lib/api/categories';
import { ImageUploader, type UploadedImageItem } from './image-uploader';
import { VariantsEditor } from './variants-editor';
import { AiDescriptionModal } from './ai-description-modal';
import { useCreateProduct, useUpdateProduct, useUpsertVariants } from '@/hooks/use-products';

const schema = z
  .object({
    name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
    slug: z.string().optional(),
    description: z.string().min(10, 'Descrição muito curta'),
    shortDescription: z.string().optional(),
    basePrice: z.number({ error: 'Preço inválido' }).min(0.01, 'Preço inválido'),
    compareAtPrice: z.number().positive('Deve ser maior que zero').optional().catch(undefined),
    categoryId: z.string().min(1, 'Selecione uma categoria'),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    weight: z.number().int().optional(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    productLength: z.number().int().optional(),
    seoTitle: z.string().max(60, 'Máximo 60 caracteres').optional(),
    seoDescription: z.string().max(160, 'Máximo 160 caracteres').optional(),
  })
  .refine((data) => !data.compareAtPrice || data.compareAtPrice > data.basePrice, {
    message: 'Preço comparativo deve ser maior que o preço atual',
    path: ['compareAtPrice'],
  });

type FormData = z.infer<typeof schema>;

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [images, setImages] = useState<UploadedImageItem[]>(
    product?.images.map((img) => ({
      id: img.id,
      thumbUrl: img.thumbUrl ?? img.url,
      cardUrl: img.cardUrl ?? img.url,
      fullUrl: img.url,
    })) ?? [],
  );
  const [variants, setVariants] = useState<Array<Partial<ProductVariant> & { stock: number }>>(
    product?.variants ?? [],
  );
  const [aiOpen, setAiOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState(product?.id ?? '');

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?.id ?? '');
  const upsertVariants = useUpsertVariants(productId);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      shortDescription: product?.shortDescription ?? '',
      basePrice: product?.basePrice ?? 0,
      compareAtPrice: product?.compareAtPrice ?? undefined,
      categoryId: product?.categoryId ?? '',
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      weight: product?.weight ?? undefined,
      width: product?.width ?? undefined,
      height: product?.height ?? undefined,
      productLength: product?.length ?? undefined,
      seoTitle: product?.seoTitle ?? '',
      seoDescription: product?.seoDescription ?? '',
    },
  });

  const name = watch('name');
  const categoryId = watch('categoryId');
  const description = watch('description');
  const seoTitle = watch('seoTitle') ?? '';
  const seoDescription = watch('seoDescription') ?? '';

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        slug: data.slug || undefined,
        description: data.description,
        shortDescription: data.shortDescription,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice ?? null,
        categoryId: data.categoryId,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        weight: data.weight,
        width: data.width,
        height: data.height,
        length: data.productLength,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      };

      let savedId = product?.id;

      if (isEdit) {
        await updateProduct.mutateAsync(payload);
      } else {
        const created = await createProduct.mutateAsync(payload);
        savedId = created.id;
        setProductId(created.id);
      }

      if (savedId && variants.length > 0) {
        await upsertVariants.mutateAsync(
          variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: v.price !== undefined ? Number(v.price) : undefined,
            stock: v.stock ?? 0,
            isActive: v.isActive,
          })),
        );
      }

      router.push('/admin/produtos');
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações básicas */}
          <section className="bg-white border border-bege-200 rounded-md p-6 space-y-4">
            <h2 className="font-serif text-lg text-flor-800">Informações básicas</h2>

            <div>
              <Label>Nome *</Label>
              <Input {...register('name')} className="mt-1" placeholder="Ex: Vestido Midi Floral" />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label>Slug</Label>
              <Input {...register('slug')} className="mt-1" placeholder="gerado-automaticamente" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço base (R$) *</Label>
                <Input
                  {...register('basePrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1"
                  placeholder="0,00"
                />
                {errors.basePrice && (
                  <p className="text-xs text-destructive mt-1">{errors.basePrice.message}</p>
                )}
              </div>
              <div>
                <Label>Preço comparativo (R$)</Label>
                <Input
                  {...register('compareAtPrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1"
                  placeholder="De..."
                />
                {errors.compareAtPrice && (
                  <p className="text-xs text-destructive mt-1">{errors.compareAtPrice.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Categoria *</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma categoria">
                        {field.value
                          ? (categories.find((c) => c.id === field.value)?.name ?? field.value)
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>
              )}
            </div>
          </section>

          {/* Descrição */}
          <section className="bg-white border border-bege-200 rounded-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-flor-800">Descrição</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAiOpen(true)}
                className="text-flor-600 border-flor-300 hover:bg-flor-50"
              >
                <Sparkles size={14} className="mr-1 text-dourado-500" />
                Gerar com IA
              </Button>
            </div>

            <div>
              <Label>Descrição completa *</Label>
              <Textarea
                {...register('description')}
                className="mt-1 min-h-[180px]"
                placeholder="Descreva o produto..."
              />
              {errors.description && (
                <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label>Descrição curta (para cards)</Label>
              <Textarea
                {...register('shortDescription')}
                className="mt-1 min-h-[80px]"
                placeholder="Resumo para cards do catálogo..."
              />
            </div>
          </section>

          {/* Imagens */}
          <section className="bg-white border border-bege-200 rounded-md p-6 space-y-4">
            <h2 className="font-serif text-lg text-flor-800">Imagens</h2>
            {productId ? (
              <ImageUploader productId={productId} initialImages={images} onChange={setImages} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Salve as informações básicas primeiro para fazer upload de imagens.
              </p>
            )}
          </section>

          {/* Variações */}
          <section className="bg-white border border-bege-200 rounded-md p-6 space-y-4">
            <h2 className="font-serif text-lg text-flor-800">Variações</h2>
            <VariantsEditor variants={variants} onChange={setVariants} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <section className="bg-white border border-bege-200 rounded-md p-6 space-y-4">
            <h2 className="font-serif text-lg text-flor-800">Status</h2>
            <div className="flex items-center justify-between">
              <Label>Produto ativo</Label>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Destaque</Label>
              <Controller
                name="isFeatured"
                control={control}
                render={({ field }) => (
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </section>

          {/* Dimensões */}
          <section className="bg-white border border-bege-200 rounded-md p-6 space-y-4">
            <h2 className="font-serif text-lg text-flor-800">Frete</h2>
            <div>
              <Label>Peso (gramas)</Label>
              <Input
                {...register('weight', { valueAsNumber: true })}
                type="number"
                className="mt-1"
                placeholder="300"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Larg. (cm)</Label>
                <Input
                  {...register('width', { valueAsNumber: true })}
                  type="number"
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Alt. (cm)</Label>
                <Input
                  {...register('height', { valueAsNumber: true })}
                  type="number"
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Comp. (cm)</Label>
                <Input
                  {...register('productLength', { valueAsNumber: true })}
                  type="number"
                  className="mt-1 h-8"
                />
              </div>
            </div>
          </section>

          {/* SEO */}
          <section className="bg-white border border-bege-200 rounded-md p-6 space-y-4">
            <h2 className="font-serif text-lg text-flor-800">SEO</h2>
            <div>
              <div className="flex items-center justify-between">
                <Label>Meta título</Label>
                <span className="text-xs text-muted-foreground">{seoTitle.length}/60</span>
              </div>
              <Input {...register('seoTitle')} className="mt-1" maxLength={60} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Meta descrição</Label>
                <span className="text-xs text-muted-foreground">{seoDescription.length}/160</span>
              </div>
              <Textarea
                {...register('seoDescription')}
                className="mt-1 min-h-[80px]"
                maxLength={160}
              />
            </div>
          </section>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/admin/produtos')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-flor-600 hover:bg-flor-700 text-white"
            >
              {saving ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar produto'}
            </Button>
          </div>
        </div>
      </div>

      <AiDescriptionModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onApply={(desc) => setValue('description', desc, { shouldDirty: true })}
        productName={name}
        categoryId={categoryId}
        categories={categories}
      />
    </form>
  );
}
