import { z } from 'zod';

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug inválido' })
  .max(100);

export const institutionalPageFormSchema = z.object({
  slug: slugSchema,
  title: z.string().min(2).max(200),
  content: z.string().max(100_000),
  metaTitle: z.string().max(70),
  metaDescription: z.string().max(160),
  ogImage: z
    .string()
    .max(2048)
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), { message: 'URL inválida (use http ou https)' }),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(-9999).max(9999),
});

export type InstitutionalPageFormValues = z.infer<typeof institutionalPageFormSchema>;

export type InstitutionalPagePublic = {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  updatedAt: string;
};

export type InstitutionalPageSummary = {
  slug: string;
  title: string;
  sortOrder: number;
  updatedAt: string;
};

export type InstitutionalPageAdmin = {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
