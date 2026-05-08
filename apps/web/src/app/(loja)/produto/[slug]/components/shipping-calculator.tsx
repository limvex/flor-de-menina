'use client';

import { useState } from 'react';

interface ShippingOption {
  name: string;
  days: string;
  price: number;
}

export function ShippingCalculator() {
  const [cep, setCep] = useState('');
  const [results, setResults] = useState<ShippingOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length < 8) return;
    setLoading(true);

    // TODO(task-#17): integrar com Melhor Envio real
    await new Promise((r) => setTimeout(r, 800));
    setResults([
      { name: 'PAC', days: '5 a 8 dias úteis', price: 24.9 },
      { name: 'Sedex', days: '2 a 4 dias úteis', price: 39.9 },
    ]);
    setLoading(false);
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  return (
    <div className="rounded border border-stone-200 p-4">
      <p className="mb-2 text-sm font-medium text-stone-800">Calcular frete e prazo</p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="00000-000"
          value={formatCep(cep)}
          onChange={(e) => setCep(e.target.value)}
          maxLength={9}
          className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <button
          onClick={handleCalculate}
          disabled={loading || cep.replace(/\D/g, '').length < 8}
          className="rounded bg-stone-800 px-4 py-2 text-sm text-white disabled:bg-stone-300 disabled:cursor-not-allowed hover:bg-stone-900 transition-colors"
        >
          {loading ? '...' : 'Calcular'}
        </button>
      </div>
      {results && (
        <ul className="mt-3 space-y-1 text-sm">
          {results.map((r) => (
            <li key={r.name} className="flex justify-between py-1">
              <span className="text-stone-700">
                {r.name} <span className="text-stone-500">({r.days})</span>
              </span>
              <span className="font-medium text-stone-800">
                R$ {r.price.toFixed(2).replace('.', ',')}
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
