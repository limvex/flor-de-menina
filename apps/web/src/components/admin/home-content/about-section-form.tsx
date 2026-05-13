'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FormSection } from '@/components/admin/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateHomeContent } from '@/lib/api/home-content';
import type { HomePageContentResponse } from '@flor/types';

const ABOUT_TEXT_MAX = 2000;

interface Props {
  initialData: HomePageContentResponse;
  token: string;
}

export function AboutSectionForm({ initialData, token }: Props) {
  const [aboutTitle, setAboutTitle] = useState(initialData.aboutTitle ?? '');
  const [aboutText, setAboutText] = useState(initialData.aboutText ?? '');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateHomeContent(token, {
          aboutTitle: aboutTitle || null,
          aboutText: aboutText || null,
        });
        toast.success('Seção "Sobre nós" salva com sucesso.');
      } catch {
        toast.error('Erro ao salvar. Tente novamente.');
      }
    });
  }

  return (
    <FormSection title="Sobre nós" description="Aparece na seção 'Nossa história' da home.">
      <div className="space-y-5">
        <div>
          <Label htmlFor="aboutTitle" className="mb-1.5 block text-sm text-flor-700">
            Título <span className="text-flor-400">(máx. 100 caracteres)</span>
          </Label>
          <Input
            id="aboutTitle"
            value={aboutTitle}
            onChange={(e) => setAboutTitle(e.target.value)}
            maxLength={100}
            placeholder="Sobre a Flor de Menina"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="aboutText" className="text-sm text-flor-700">
              Texto
            </Label>
            <span className="text-xs text-flor-400">
              {aboutText.length}/{ABOUT_TEXT_MAX}
            </span>
          </div>
          <Textarea
            id="aboutText"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value.slice(0, ABOUT_TEXT_MAX))}
            rows={5}
            placeholder="Loja de moda feminina em Maceió-AL com amor por cada detalhe."
            className="resize-y"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending} className="min-w-[140px]">
            {isPending ? 'Salvando…' : 'Salvar sobre nós'}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}
