'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SizeChartData {
  title: string;
  columnHeader: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measureTable: SizeChartData | null | unknown;
  categoryName: string;
}

function isValidSizeChart(data: unknown): data is SizeChartData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d.columns) && Array.isArray(d.rows);
}

export function MeasureTableModal({ open, onOpenChange, measureTable, categoryName }: Props) {
  const chart = isValidSizeChart(measureTable) ? measureTable : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {chart?.title ?? 'Tabela de medidas'} — {categoryName}
          </DialogTitle>
        </DialogHeader>
        {!chart ? (
          <p className="text-stone-600">Tabela de medidas indisponível para esta categoria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="px-3 py-2 text-left font-medium text-stone-800">
                    {chart.columnHeader}
                  </th>
                  {chart.columns.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-stone-800">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    <td className="px-3 py-2 font-medium text-stone-700">{row.label}</td>
                    {row.values.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-stone-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-stone-500">
          Medidas em centímetros. Em caso de dúvida, entre em contato pelo Instagram.
        </p>
      </DialogContent>
    </Dialog>
  );
}
