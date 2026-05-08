'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MeasureTableData {
  cols: string[];
  rows: string[][];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measureTable: MeasureTableData | null;
  categoryName: string;
}

export function MeasureTableModal({ open, onOpenChange, measureTable, categoryName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tabela de medidas — {categoryName}</DialogTitle>
        </DialogHeader>
        {!measureTable ? (
          <p className="text-stone-600">Tabela de medidas indisponível para esta categoria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  {measureTable.cols.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-stone-800">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measureTable.rows.map((row, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    {row.map((cell, j) => (
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
