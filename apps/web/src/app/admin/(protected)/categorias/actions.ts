'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function getToken() {
  return (await cookies()).get('access_token')?.value ?? '';
}

function jsonHdrs(t: string): HeadersInit {
  return { Cookie: `access_token=${t}`, 'Content-Type': 'application/json' };
}

async function toResult(res: Response): Promise<{ ok: boolean; error?: string }> {
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const raw = body.message;
  const msg = Array.isArray(raw)
    ? String(raw[0])
    : typeof raw === 'string'
      ? raw
      : 'Erro inesperado';
  return { ok: false, error: msg };
}

export async function createCategoryAction(
  data: unknown,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const t = await getToken();
    const res = await fetch(`${API}/admin/categories`, {
      method: 'POST',
      headers: jsonHdrs(t),
      body: JSON.stringify(data),
    });
    const result = await toResult(res);
    if (result.ok) revalidatePath('/admin/categorias');
    return result;
  } catch {
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

export async function updateCategoryAction(
  id: string,
  data: unknown,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const t = await getToken();
    const res = await fetch(`${API}/admin/categories/${id}`, {
      method: 'PATCH',
      headers: jsonHdrs(t),
      body: JSON.stringify(data),
    });
    const result = await toResult(res);
    if (result.ok) revalidatePath('/admin/categorias');
    return result;
  } catch {
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

export async function deleteCategoryAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const t = await getToken();
    const res = await fetch(`${API}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Cookie: `access_token=${t}` },
    });
    const result = await toResult(res);
    if (result.ok) revalidatePath('/admin/categorias');
    return result;
  } catch {
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

export async function toggleActiveCategoryAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const t = await getToken();
    const res = await fetch(`${API}/admin/categories/${id}/toggle-active`, {
      method: 'PATCH',
      headers: { Cookie: `access_token=${t}` },
    });
    const result = await toResult(res);
    if (result.ok) revalidatePath('/admin/categorias');
    return result;
  } catch {
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}
