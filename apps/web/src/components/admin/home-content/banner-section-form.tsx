'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FormSection } from '@/components/admin/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BannerUpload } from './banner-upload';
import { updateHomeContent } from '@/lib/api/home-content';
import type { HomePageContentResponse } from '@flor/types';

interface Props {
  initialData: HomePageContentResponse;
  token: string;
}

export function BannerSectionForm({ initialData, token }: Props) {
  const [bannerImageUrl, setBannerImageUrl] = useState(initialData.bannerImageUrl);
  const [bannerTitle, setBannerTitle] = useState(initialData.bannerTitle ?? '');
  const [bannerSubtitle, setBannerSubtitle] = useState(initialData.bannerSubtitle ?? '');
  const [bannerButtonText, setBannerButtonText] = useState(initialData.bannerButtonText ?? '');
  const [bannerButtonUrl, setBannerButtonUrl] = useState(initialData.bannerButtonUrl ?? '');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateHomeContent(token, {
          bannerImageUrl: bannerImageUrl || null,
          bannerTitle: bannerTitle || null,
          bannerSubtitle: bannerSubtitle || null,
          bannerButtonText: bannerButtonText || null,
          bannerButtonUrl: bannerButtonUrl || null,
        });
        toast.success('Banner salvo com sucesso.');
      } catch {
        toast.error('Erro ao salvar o banner. Tente novamente.');
      }
    });
  }

  return (
    <FormSection title="Banner principal" description="Imagem e textos exibidos no topo da home.">
      <div className="space-y-5">
        <div>
          <Label className="mb-2 block text-sm font-medium text-flor-700">Imagem do banner</Label>
          <BannerUpload
            currentUrl={bannerImageUrl}
            onUploadComplete={(url) => setBannerImageUrl(url)}
            onError={(msg) => toast.error(msg)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="bannerTitle" className="mb-1.5 block text-sm text-flor-700">
              Título <span className="text-flor-400">(máx. 100 caracteres)</span>
            </Label>
            <Input
              id="bannerTitle"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              maxLength={100}
              placeholder="Nova Coleção"
            />
          </div>

          <div>
            <Label htmlFor="bannerSubtitle" className="mb-1.5 block text-sm text-flor-700">
              Subtítulo <span className="text-flor-400">(máx. 200 caracteres)</span>
            </Label>
            <Input
              id="bannerSubtitle"
              value={bannerSubtitle}
              onChange={(e) => setBannerSubtitle(e.target.value)}
              maxLength={200}
              placeholder="Peças exclusivas para você"
            />
          </div>

          <div>
            <Label htmlFor="bannerButtonText" className="mb-1.5 block text-sm text-flor-700">
              Texto do botão CTA <span className="text-flor-400">(máx. 50 caracteres)</span>
            </Label>
            <Input
              id="bannerButtonText"
              value={bannerButtonText}
              onChange={(e) => setBannerButtonText(e.target.value)}
              maxLength={50}
              placeholder="Ver coleção"
            />
          </div>

          <div>
            <Label htmlFor="bannerButtonUrl" className="mb-1.5 block text-sm text-flor-700">
              URL do botão
            </Label>
            <Input
              id="bannerButtonUrl"
              value={bannerButtonUrl}
              onChange={(e) => setBannerButtonUrl(e.target.value)}
              maxLength={500}
              placeholder="/produtos"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending} className="min-w-[120px]">
            {isPending ? 'Salvando…' : 'Salvar banner'}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}
