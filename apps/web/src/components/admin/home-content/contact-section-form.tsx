'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FormSection } from '@/components/admin/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateHomeContent } from '@/lib/api/home-content';
import type { HomePageContentResponse } from '@flor/types';

interface Props {
  initialData: HomePageContentResponse;
  token: string;
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, '');
}

export function ContactSectionForm({ initialData, token }: Props) {
  const [whatsappNumber, setWhatsappNumber] = useState(initialData.whatsappNumber ?? '');
  const [instagramUrl, setInstagramUrl] = useState(initialData.instagramUrl ?? '');
  const [isPending, startTransition] = useTransition();

  const waDigits = digitsOnly(whatsappNumber);
  const waPreview = waDigits.length >= 10 ? `https://wa.me/${waDigits}` : null;

  function handleSave() {
    const cleanWa = digitsOnly(whatsappNumber);
    if (cleanWa && (cleanWa.length < 10 || cleanWa.length > 15)) {
      toast.error('WhatsApp inválido. Use entre 10 e 15 dígitos com DDI (ex: 5582999999999).');
      return;
    }

    startTransition(async () => {
      try {
        await updateHomeContent(token, {
          whatsappNumber: cleanWa || null,
          instagramUrl: instagramUrl || null,
        });
        toast.success('Contato salvo com sucesso.');
      } catch {
        toast.error('Erro ao salvar. Tente novamente.');
      }
    });
  }

  return (
    <FormSection
      title="Contato e redes sociais"
      description="Usado no footer e botões de contato da loja."
    >
      <div className="space-y-5">
        <div>
          <Label htmlFor="whatsappNumber" className="mb-1.5 block text-sm text-flor-700">
            WhatsApp
          </Label>
          <Input
            id="whatsappNumber"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="5582999999999"
            inputMode="numeric"
          />
          <p className="mt-1 text-xs text-flor-400">Inclua o código do país. Ex: 5582999999999</p>
          {waPreview && (
            <p className="mt-1 text-xs text-flor-500">
              Link: <span className="font-mono">{waPreview}</span>
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="instagramUrl" className="mb-1.5 block text-sm text-flor-700">
            Instagram (URL completa)
          </Label>
          <Input
            id="instagramUrl"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/flordemenina"
            type="url"
          />
          <p className="mt-1 text-xs text-flor-400">
            URL completa. Ex: https://instagram.com/flordemenina
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending} className="min-w-[120px]">
            {isPending ? 'Salvando…' : 'Salvar contato'}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}
