'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SizeChart } from '@flor/types';
import { Input } from '@/components/ui/input';
import { SizeChartPreview } from '@/components/shared/size-chart-preview';

const DEFAULT_CHART: SizeChart = {
  title: 'Guia de Medidas',
  columnHeader: 'TAMANHO',
  columns: ['P', 'M', 'G', 'GG'],
  rows: [
    { label: 'Busto (cm)', values: ['86', '90', '94', '98'] },
    { label: 'Cintura (cm)', values: ['66', '70', '74', '78'] },
    { label: 'Quadril (cm)', values: ['92', '96', '100', '104'] },
  ],
};

interface SizeChartEditorProps {
  value: SizeChart | null | undefined;
  onChange: (value: SizeChart | null) => void;
  inherited?: SizeChart | null;
}

export function SizeChartEditor({ value, onChange, inherited }: SizeChartEditorProps) {
  const [enabled, setEnabled] = useState(() => value != null);
  const [draft, setDraft] = useState<SizeChart>(() => value ?? DEFAULT_CHART);

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    onChange(next ? draft : null);
  }

  function patch(update: Partial<SizeChart>) {
    const next = { ...draft, ...update };
    setDraft(next);
    onChange(next);
  }

  function updateColumn(idx: number, val: string) {
    const columns = [...draft.columns];
    columns[idx] = val;
    patch({ columns });
  }

  function updateRowLabel(rIdx: number, label: string) {
    patch({ rows: draft.rows.map((r, i) => (i === rIdx ? { ...r, label } : r)) });
  }

  function updateCell(rIdx: number, cIdx: number, val: string) {
    patch({
      rows: draft.rows.map((r, i) => {
        if (i !== rIdx) return r;
        const values = [...r.values];
        values[cIdx] = val;
        return { ...r, values };
      }),
    });
  }

  function addColumn() {
    if (draft.columns.length >= 12) return;
    patch({
      columns: [...draft.columns, `T${draft.columns.length + 1}`],
      rows: draft.rows.map((r) => ({ ...r, values: [...r.values, ''] })),
    });
  }

  function removeColumn(idx: number) {
    if (draft.columns.length <= 1) return;
    patch({
      columns: draft.columns.filter((_, i) => i !== idx),
      rows: draft.rows.map((r) => ({ ...r, values: r.values.filter((_, i) => i !== idx) })),
    });
  }

  function addRow() {
    if (draft.rows.length >= 12) return;
    patch({
      rows: [
        ...draft.rows,
        { label: `Medida ${draft.rows.length + 1}`, values: draft.columns.map(() => '') },
      ],
    });
  }

  function removeRow(idx: number) {
    if (draft.rows.length <= 1) return;
    patch({ rows: draft.rows.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggleEnabled}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-flor-600 ${
            enabled ? 'bg-flor-600' : 'bg-flor-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow ring-0 transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-flor-700">
          {enabled ? 'Tabela própria ativada' : 'Usar tabela herdada do nível acima'}
        </span>
      </div>

      {!enabled && inherited && (
        <div className="rounded-lg border border-flor-100 bg-flor-50 p-4">
          <p className="mb-3 text-xs text-flor-500">Tabela herdada da categoria pai:</p>
          <SizeChartPreview chart={inherited} />
        </div>
      )}

      {!enabled && !inherited && (
        <p className="text-sm italic text-flor-400">Nenhuma tabela de medidas configurada.</p>
      )}

      {enabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-flor-600">
                Título da tabela
              </label>
              <Input
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                placeholder="Guia de Medidas"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-flor-600">
                Cabeçalho da 1ª coluna
              </label>
              <Input
                value={draft.columnHeader}
                onChange={(e) => patch({ columnHeader: e.target.value })}
                placeholder="TAMANHO"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-flor-100">
            <table className="w-full min-w-[400px] border-collapse text-sm">
              <thead>
                <tr className="bg-flor-50">
                  <th className="border border-flor-200 px-2 py-1.5 text-left text-xs font-medium text-flor-600 w-36">
                    {draft.columnHeader}
                  </th>
                  {draft.columns.map((col, i) => (
                    <th key={i} className="border border-flor-200 px-1 py-1 min-w-[80px]">
                      <div className="flex items-center gap-1">
                        <Input
                          value={col}
                          onChange={(e) => updateColumn(i, e.target.value)}
                          className="h-6 px-1 text-center text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeColumn(i)}
                          disabled={draft.columns.length <= 1}
                          className="text-flor-400 hover:text-destructive disabled:opacity-30"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="border border-flor-200 px-2 py-1 w-9">
                    <button
                      type="button"
                      onClick={addColumn}
                      disabled={draft.columns.length >= 12}
                      title="Adicionar coluna"
                      className="text-flor-500 hover:text-flor-700 disabled:opacity-30"
                    >
                      <Plus className="size-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {draft.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-flor-50/60'}>
                    <td className="border border-flor-200 px-1 py-1">
                      <Input
                        value={row.label}
                        onChange={(e) => updateRowLabel(rIdx, e.target.value)}
                        className="h-6 px-1 text-xs"
                        placeholder="Medida"
                      />
                    </td>
                    {row.values.map((val, cIdx) => (
                      <td key={cIdx} className="border border-flor-200 px-1 py-1">
                        <Input
                          value={val}
                          onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                          className="h-6 px-1 text-center text-xs"
                          placeholder="—"
                        />
                      </td>
                    ))}
                    <td className="border border-flor-200 px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(rIdx)}
                        disabled={draft.rows.length <= 1}
                        className="text-flor-400 hover:text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    colSpan={draft.columns.length + 2}
                    className="border border-flor-200 px-2 py-1"
                  >
                    <button
                      type="button"
                      onClick={addRow}
                      disabled={draft.rows.length >= 12}
                      className="flex items-center gap-1 text-xs text-flor-500 hover:text-flor-700 disabled:opacity-30"
                    >
                      <Plus className="size-3.5" />
                      Adicionar linha
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-flor-100 bg-flor-50 p-4">
            <p className="mb-3 text-xs text-flor-500">Pré-visualização:</p>
            <SizeChartPreview chart={draft} />
          </div>
        </div>
      )}
    </div>
  );
}
