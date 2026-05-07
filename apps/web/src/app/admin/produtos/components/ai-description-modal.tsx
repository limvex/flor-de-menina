'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw } from 'lucide-react';
import { aiApi, type GenerateDescriptionParams } from '@/lib/api/ai';
import { useAiCredits } from '@/hooks/use-ai-credits';
import { type Category } from '@/lib/api/categories';

interface AiDescriptionModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (description: string) => void;
  productName: string;
  categoryId?: string | null;
  categories: Category[];
}

export function AiDescriptionModal({
  open,
  onClose,
  onApply,
  productName,
  categoryId,
  categories,
}: AiDescriptionModalProps) {
  const { data: credits } = useAiCredits();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [params, setParams] = useState<Partial<GenerateDescriptionParams>>({
    name: productName,
    categoryId: categoryId ?? undefined,
    tone: 'elegante',
    length: 'media',
  });
  const [attributes, setAttributes] = useState('');

  const generate = async () => {
    setLoading(true);
    try {
      const result = await aiApi.generateDescription({
        name: params.name ?? productName,
        categoryId: params.categoryId ?? categoryId ?? '',
        attributes: attributes ? attributes.split(',').map((a) => a.trim()) : [],
        tone: params.tone,
        length: params.length,
      });
      setGenerated(result.description);
      setIsMock(result.mock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generated) {
      onApply(generated);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Sparkles size={18} className="text-dourado-500" />
            Gerar descrição com IA
          </DialogTitle>
        </DialogHeader>

        {credits !== null && credits !== undefined && (
          <div className="text-xs text-muted-foreground">
            Crédito OpenRouter disponível:{' '}
            <span className="font-medium text-flor-700">US${credits.available.toFixed(4)}</span>
          </div>
        )}

        <div className="space-y-4 mt-2">
          <div>
            <Label>Nome do produto</Label>
            <Input
              value={params.name ?? ''}
              onChange={(e) => setParams({ ...params, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Categoria</Label>
            <Select
              value={params.categoryId ?? ''}
              onValueChange={(v) => setParams({ ...params, categoryId: v ?? undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Atributos extras (opcional, separados por vírgula)</Label>
            <Input
              placeholder="ex: tecido leve, manga curta, modelagem slim"
              value={attributes}
              onChange={(e) => setAttributes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tom</Label>
              <Select
                value={params.tone ?? 'elegante'}
                onValueChange={(v) =>
                  setParams({ ...params, tone: v as GenerateDescriptionParams['tone'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elegante">Elegante</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="romantica">Romântica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Comprimento</Label>
              <Select
                value={params.length ?? 'media'}
                onValueChange={(v) =>
                  setParams({ ...params, length: v as GenerateDescriptionParams['length'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curta">Curta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="longa">Longa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={loading || !params.categoryId}
            className="w-full bg-flor-600 hover:bg-flor-700 text-white"
          >
            {loading ? 'Gerando...' : 'Gerar descrição'}
          </Button>

          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          )}

          {generated && !loading && (
            <div className="rounded-md border border-bege-200 bg-bege-50 p-4 space-y-3">
              {isMock && (
                <Badge variant="secondary" className="mb-2">
                  Modo mock — configure OPENROUTER_API_KEY
                </Badge>
              )}
              <p className="text-sm text-flor-800 whitespace-pre-wrap">{generated}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
                  <RefreshCw size={14} className="mr-1" />
                  Regenerar
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="bg-flor-600 hover:bg-flor-700 text-white"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
