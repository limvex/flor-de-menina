'use client';

import { MovementSourceLabel } from './movement-source-label';
import type { StockMovementHistoryItem, StockMovementType } from '@flor/types';

const TYPE_CONFIG: Record<
  StockMovementType,
  { label: string; color: string; sign: '+' | '-' | '±' }
> = {
  IN: { label: 'Entrada', color: 'bg-green-100 text-green-700', sign: '+' },
  OUT: { label: 'Saída', color: 'bg-red-100 text-red-700', sign: '-' },
  ADJUST: { label: 'Ajuste', color: 'bg-blue-100 text-blue-700', sign: '±' },
};

interface MovementHistoryTableProps {
  items: StockMovementHistoryItem[];
}

export function MovementHistoryTable({ items }: MovementHistoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-flor-100 py-12 text-center text-flor-400 text-sm">
        Nenhuma movimentação registrada.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-flor-100 overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-flor-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-flor-700">Data / Hora</th>
            <th className="text-left px-4 py-3 font-medium text-flor-700">Tipo</th>
            <th className="text-left px-4 py-3 font-medium text-flor-700">Fonte</th>
            <th className="text-right px-4 py-3 font-medium text-flor-700">Qtd</th>
            <th className="text-right px-4 py-3 font-medium text-flor-700">Estoque após</th>
            <th className="text-left px-4 py-3 font-medium text-flor-700">Responsável</th>
            <th className="text-left px-4 py-3 font-medium text-flor-700">Observação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
            const cfg = TYPE_CONFIG[m.type];
            const delta =
              m.type === 'IN'
                ? m.quantity
                : m.type === 'OUT'
                  ? -m.quantity
                  : m.stockAfter - m.stockBefore;
            return (
              <tr key={m.id} className="border-t border-flor-100 hover:bg-flor-50/30">
                <td className="px-4 py-3 text-flor-500 whitespace-nowrap">
                  {new Date(m.createdAt).toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-flor-600">
                  <MovementSourceLabel source={m.source} />
                  {m.orderId && (
                    <span className="ml-1 text-flor-400 text-xs">#{m.orderId.slice(-6)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  <span className={delta >= 0 ? 'text-green-700' : 'text-red-700'}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-flor-800">{m.stockAfter}</td>
                <td className="px-4 py-3 text-flor-500">{m.userName ?? 'Sistema'}</td>
                <td className="px-4 py-3 text-flor-400 max-w-[200px]" title={m.reason ?? undefined}>
                  <span className="truncate block">{m.reason ?? '—'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
