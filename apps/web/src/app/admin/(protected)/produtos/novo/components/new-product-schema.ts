import { z } from 'zod';

export const newProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Dê um nome ao produto').min(3, 'Dê um nome ao produto'),
    description: z.string().optional(),
    categoryId: z.string().min(1, 'Escolha uma categoria'),
    basePrice: z
      .number({ error: 'Informe o preço de venda' })
      .min(0.01, 'Informe o preço de venda'),
    compareAtPrice: z
      .number()
      .positive('Preço comparativo deve ser maior que o preço de venda')
      .optional()
      .catch(undefined),
    slug: z.string().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    weight: z.number().int().nonnegative().optional().catch(undefined),
    width: z.number().int().nonnegative().optional().catch(undefined),
    height: z.number().int().nonnegative().optional().catch(undefined),
    productLength: z.number().int().nonnegative().optional().catch(undefined),
    seoTitle: z.string().max(60, 'Máximo 60 caracteres').optional(),
    seoDescription: z.string().max(160, 'Máximo 160 caracteres').optional(),
  })
  .refine((data) => !data.compareAtPrice || data.compareAtPrice > data.basePrice, {
    message: 'Preço comparativo deve ser maior que o preço de venda',
    path: ['compareAtPrice'],
  });

export type NewProductFormData = z.infer<typeof newProductSchema>;
