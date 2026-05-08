'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  description: string;
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
}

export function ProductTabs({ description, weight, width, height, length }: Props) {
  const hasDetails = weight || width || height || length;

  return (
    <div className="mt-12 border-t border-stone-100 pt-10">
      <Tabs defaultValue="description">
        <TabsList className="mb-6">
          <TabsTrigger value="description">Descrição</TabsTrigger>
          {hasDetails && <TabsTrigger value="details">Detalhes</TabsTrigger>}
          <TabsTrigger value="returns">Trocas e Devoluções</TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <div
            className="prose prose-stone max-w-none text-stone-700"
            dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br/>') }}
          />
        </TabsContent>

        {hasDetails && (
          <TabsContent value="details">
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {weight && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-500">Peso</dt>
                  <dd className="mt-1 text-stone-800">{weight}g</dd>
                </div>
              )}
              {width && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-500">Largura</dt>
                  <dd className="mt-1 text-stone-800">{width}cm</dd>
                </div>
              )}
              {height && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-500">Altura</dt>
                  <dd className="mt-1 text-stone-800">{height}cm</dd>
                </div>
              )}
              {length && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-stone-500">Comprimento</dt>
                  <dd className="mt-1 text-stone-800">{length}cm</dd>
                </div>
              )}
            </dl>
          </TabsContent>
        )}

        <TabsContent value="returns">
          <div className="max-w-lg space-y-3 text-stone-700">
            <p>
              Aceitamos trocas e devoluções em até <strong>7 dias corridos</strong> após o
              recebimento.
            </p>
            <p>O produto deve estar em perfeitas condições, com etiqueta e embalagem originais.</p>
            <p>
              Para solicitar, entre em contato pelo Instagram{' '}
              <a
                href="https://instagram.com/flordemeninaoficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-900 underline"
              >
                @flordemeninaoficial
              </a>
              .
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
