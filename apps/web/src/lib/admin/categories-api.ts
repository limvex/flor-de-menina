import type { CategoryAdminDto } from '@flor/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

function hdrs(token: string): HeadersInit {
  return { Cookie: `access_token=${token}` };
}

export async function fetchCategories(
  token: string,
  params?: Record<string, string>,
): Promise<CategoryAdminDto[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API}/admin/categories${qs}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao buscar categorias');
  return res.json();
}

export async function fetchCategory(token: string, id: string): Promise<CategoryAdminDto> {
  const res = await fetch(`${API}/admin/categories/${id}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Categoria não encontrada');
  return res.json();
}
