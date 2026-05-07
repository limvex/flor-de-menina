import type { CategoryPublicDto } from '@flor/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function fetchCategoriesTree(): Promise<CategoryPublicDto[]> {
  const res = await fetch(`${API}/categories`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao buscar categorias');
  return res.json();
}
