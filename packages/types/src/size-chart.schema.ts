import { z } from 'zod';

export const SizeChartSchema = z
  .object({
    title: z.string().min(1).max(100).default('Guia de Medidas'),
    columnHeader: z.string().min(1).max(50).default('TAMANHO'),
    columns: z.array(z.string().max(30)).min(1).max(12),
    rows: z
      .array(
        z.object({
          label: z.string().min(1).max(50),
          values: z.array(z.string().max(50)),
        }),
      )
      .min(1)
      .max(12),
  })
  .refine((data) => data.rows.every((r) => r.values.length === data.columns.length), {
    message: 'Cada linha deve ter o mesmo número de valores que colunas',
  });

export type SizeChart = z.infer<typeof SizeChartSchema>;
