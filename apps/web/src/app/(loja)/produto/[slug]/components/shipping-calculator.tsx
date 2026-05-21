'use client';

import { useState } from 'react';
import { quoteShipping } from '@/lib/api/orders';
import { getShippingLabel } from '@/lib/shipping-labels';
import { formatPrice } from '@/lib/format';

interface Props {
  variantId: string | null;
  subtotal: number;
}

export function ShippingCalculator({ variantId, subtotal }: Props) {
  const [cep, setCep] = useState('');
  const [results, setResults] = useState<Array<{
    service: string;
    carrier: string;
    estimatedDays: number;
    cost: number;
  }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length < 8 || !variantId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await quoteShipping({
        destinationZipCode: cleaned,
        subtotal,
        items: [{ variantId, quantity: 1 }],
      });
      setResults(
        result.options.map((o) => ({
          service: o.service,
          carrier: o.carrier,
          estimatedDays: o.estimatedDays,
          cost: o.cost,
        })),
      );
    } catch {
      setError('Não foi possível calcular o frete. Verifique o CEP e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  return (
    <div className="rounded border border-stone-200 p-4">
      <p className="mb-2 text-sm font-medium text-stone-800">Calcular frete e prazo</p>
      {!variantId && (
        <p className="mb-2 text-xs text-stone-400">Selecione uma variação para calcular o frete.</p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="00000-000"
          value={formatCep(cep)}
          onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
          maxLength={9}
          disabled={!variantId}
          className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-50 disabled:text-stone-400"
        />
        <button
          onClick={handleCalculate}
          disabled={loading || cep.replace(/\D/g, '').length < 8 || !variantId}
          className="rounded bg-stone-800 px-4 py-2 text-sm text-white disabled:bg-stone-300 disabled:cursor-not-allowed hover:bg-stone-900 transition-colors"
        >
          {loading ? '...' : 'Calcular'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {results && (
        <ul className="mt-3 space-y-1 text-sm">
          {results.map((r) => (
            <li key={r.service} className="flex justify-between py-1">
              <span className="text-stone-700">
                {getShippingLabel(r.service)}{' '}
                <span className="text-stone-500">({r.estimatedDays} dias úteis)</span>
              </span>
              <span className="font-medium text-stone-800">
                {r.cost === 0 ? 'Grátis' : formatPrice(r.cost)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <a
        href="https://buscacepinter.correios.com.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-xs text-stone-500 underline hover:text-stone-700"
      >
        Não sei meu CEP
      </a>
    </div>
  );
}
