import type { SizeChart } from '@flor/types';

interface SizeChartPreviewProps {
  chart: SizeChart;
  className?: string;
}

export function SizeChartPreview({ chart, className }: SizeChartPreviewProps) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-flor-800 mb-2">{chart.title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-flor-100">
              <th className="border border-flor-200 px-3 py-2 text-left text-xs font-semibold text-flor-700">
                {chart.columnHeader}
              </th>
              {chart.columns.map((col, i) => (
                <th
                  key={i}
                  className="border border-flor-200 px-3 py-2 text-center text-xs font-semibold text-flor-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-flor-50'}>
                <td className="border border-flor-200 px-3 py-2 text-xs font-medium text-flor-700">
                  {row.label}
                </td>
                {row.values.map((val, j) => (
                  <td
                    key={j}
                    className="border border-flor-200 px-3 py-2 text-center text-xs text-flor-600"
                  >
                    {val || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
