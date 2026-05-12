import type { InstitutionalPagePublic, InstitutionalPageSummary } from '@flor/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function fetchInstitutionalPagesList(): Promise<InstitutionalPageSummary[]> {
  const res = await fetch(`${API_URL}/pages`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Erro ao listar páginas institucionais (${res.status})`);
  }
  return res.json() as Promise<InstitutionalPageSummary[]>;
}

export async function fetchInstitutionalPageBySlug(
  slug: string,
): Promise<InstitutionalPagePublic | null> {
  const res = await fetch(`${API_URL}/pages/${slug}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Erro ao carregar página (${res.status})`);
  }
  return res.json() as Promise<InstitutionalPagePublic>;
}
