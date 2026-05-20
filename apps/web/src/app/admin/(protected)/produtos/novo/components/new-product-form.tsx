'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/errors';
import { productsApi } from '@/lib/api/products';
import { uploadsApi } from '@/lib/api/uploads';
import { type Category } from '@/lib/api/categories';
import { useCreateProduct } from '@/hooks/use-products';
import { PhotoUploader, type PendingPhoto } from './photo-uploader';
import { BasicInfoStep } from './basic-info-step';
import { PricingStep } from './pricing-step';
import { VariationsStep, type VariantDraft } from './variations-step';
import { AdvancedStep } from './advanced-step';
import { newProductSchema, type NewProductFormData } from './new-product-schema';

export type { NewProductFormData };

interface NewProductFormProps {
  categories: Category[];
}

export function NewProductForm({ categories }: NewProductFormProps) {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadPhase, setUploadPhase] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<NewProductFormData>({
    resolver: zodResolver(newProductSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      basePrice: undefined as unknown as number,
      compareAtPrice: undefined,
      slug: '',
      isActive: true,
      isFeatured: false,
      seoTitle: '',
      seoDescription: '',
    },
  });

  const seoTitle = watch('seoTitle') ?? '';
  const seoDescription = watch('seoDescription') ?? '';

  const onSubmit = async (data: NewProductFormData) => {
    setSaving(true);
    setUploadPhase(false);

    try {
      const payload = {
        name: data.name.trim(),
        slug: data.slug?.trim() || undefined,
        description: data.description?.trim() || '',
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice ?? null,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        weight: data.weight,
        width: data.width,
        height: data.height,
        length: data.productLength,
        seoTitle: data.seoTitle?.trim() || undefined,
        seoDescription: data.seoDescription?.trim() || undefined,
      };

      const created = await createProduct.mutateAsync(payload);
      const savedId = created.id;

      if (variants.length > 0) {
        await productsApi.upsertVariants(
          savedId,
          variants.map((v) => ({
            size: v.size,
            color: v.color,
            stock: v.stock ?? 0,
            isActive: v.isActive ?? true,
          })),
        );
      }

      const photosToUpload = [...pendingPhotos];

      if (photosToUpload.length > 0) {
        setUploadPhase(true);
        const failures: Array<{ name: string; reason: string }> = [];

        for (const photo of photosToUpload) {
          try {
            if (!photo.file?.size) {
              throw new Error('Arquivo vazio');
            }
            await uploadsApi.uploadProductImage(savedId, photo.file);
          } catch (err) {
            const reason = err instanceof Error ? err.message : 'Erro no envio';
            console.error('[upload]', photo.file?.name, reason, err);
            failures.push({ name: photo.file?.name ?? 'imagem', reason });
          }
        }

        if (failures.length > 0) {
          const detail = failures.map((f) => `${f.name} (${f.reason})`).join('; ');
          toast.warning(
            `Produto criado, mas não foi possível enviar: ${detail}. Você pode tentar de novo na edição.`,
          );
        }
      }

      toast.success('Produto criado com sucesso!');
      router.push(`/admin/produtos/${savedId}`);
    } catch (err: unknown) {
      toast.error(getUserFacingErrorMessage(err));
      console.error(err);
    } finally {
      setSaving(false);
      setUploadPhase(false);
    }
  };

  const submitLabel = saving ? (uploadPhase ? 'Enviando fotos…' : 'Salvando…') : 'Salvar produto';

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6 flex scroll-mt-4 items-center gap-3">
        <Link
          href="/admin/produtos"
          className="text-muted-foreground hover:text-flor-700 transition-colors shrink-0"
          aria-label="Voltar para produtos"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="min-w-0">
          <h1 className="font-serif text-2xl text-flor-800">Novo produto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fotos, nome, preço e categoria — o essencial em poucos passos
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24 sm:pb-0">
        <PhotoUploader files={pendingPhotos} onChange={setPendingPhotos} disabled={saving} />

        <BasicInfoStep
          register={register}
          control={control}
          errors={errors}
          categories={categories}
        />

        <PricingStep control={control} errors={errors} />

        <VariationsStep variants={variants} onChange={setVariants} />

        <AdvancedStep
          register={register}
          control={control}
          seoTitleLength={seoTitle.length}
          seoDescriptionLength={seoDescription.length}
        />

        {/* Desktop / tablet: ações inline */}
        <div className="hidden sm:flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/admin/produtos')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-flor-600 hover:bg-flor-700 text-white"
          >
            {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>

      {/* Mobile: footer fixo (fora do form — não infla altura do scroll) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bege-200 bg-white/95 backdrop-blur-sm p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/admin/produtos')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving}
            className="flex-1 bg-flor-600 hover:bg-flor-700 text-white"
            onClick={handleSubmit(onSubmit)}
          >
            {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
