'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import type { QuoteShippingResponse, ShippingOption } from '@flor/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
}

export function ShippingTestModal({ open, onOpenChange, token }: Props) {
  const [cep, setCep] = useState('01310100');
  const [result, setResult] = useState<QuoteShippingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

  async function handleTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    const start = Date.now();

    try {
      const res = await fetch(`${apiBase}/admin/shipping/test-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` },
        credentials: 'include',
        body: JSON.stringify({ destinationZipCode: cep }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }

      const data = (await res.json()) as QuoteShippingResponse;
      setResult(data);
      setElapsed(Date.now() - start);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Testar cotação de frete</DialogTitle>
          <DialogDescription>
            Simula uma cotação com o provedor configurado (subtotal R$299, 1 pacote padrão).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="testCep">CEP de destino</Label>
            <div className="flex gap-2">
              <Input
                id="testCep"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="01310-100"
                maxLength={9}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleTest}
                disabled={loading}
                className="bg-flor-800 hover:bg-flor-700 text-white"
              >
                Cotar
              </Button>
            </div>
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-2">
              {result.usedFallback && (
                <div
                  role="alert"
                  className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700"
                >
                  Usando mock como fallback (provedor principal falhou)
                </div>
              )}
              {elapsed !== null && (
                <p className="text-xs text-flor-500">Tempo de resposta: {elapsed}ms</p>
              )}
              <ul className="divide-y divide-flor-100 rounded-lg border border-flor-100">
                {result.options.map((opt: ShippingOption) => (
                  <li key={opt.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-flor-800">{opt.label}</p>
                      <p className="text-xs text-flor-500">{opt.carrier}</p>
                    </div>
                    <span className="font-semibold text-flor-800">
                      {opt.cost === 0 ? 'Grátis' : formatPrice(opt.cost)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
