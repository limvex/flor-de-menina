import type { InstitutionalPageAdmin } from '@flor/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

function hdrs(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', Cookie: `access_token=${token}` };
}

function clientHdrs(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export async function fetchAdminPages(
  token: string | null,
  params?: Record<string, string>,
): Promise<InstitutionalPageAdmin[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API}/admin/pages${qs}`, {
    headers: token ? hdrs(token) : clientHdrs(),
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao buscar páginas');
  const raw: unknown = await res.json();
  return (Array.isArray(raw) ? raw : []).map((row) => normalizeAdminPage(row));
}

function normalizeAdminPage(row: unknown): InstitutionalPageAdmin {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    content: String(r.content),
    metaTitle: (r.metaTitle as string | null) ?? null,
    metaDescription: (r.metaDescription as string | null) ?? null,
    ogImage: (r.ogImage as string | null) ?? null,
    isActive: Boolean(r.isActive),
    sortOrder: Number(r.sortOrder ?? 0),
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  };
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return new Date().toISOString();
}

export async function fetchAdminPage(token: string, id: string): Promise<InstitutionalPageAdmin> {
  const res = await fetch(`${API}/admin/pages/${id}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Página não encontrada');
  return normalizeAdminPage(await res.json());
}

export interface SavePagePayload {
  slug: string;
  title: string;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export async function createAdminPage(data: SavePagePayload): Promise<InstitutionalPageAdmin> {
  const res = await fetch(`${API}/admin/pages`, {
    method: 'POST',
    headers: clientHdrs(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string | string[] }).message?.toString() ?? 'Erro ao criar',
    );
  }
  return normalizeAdminPage(await res.json());
}

export async function updateAdminPage(
  id: string,
  data: Partial<SavePagePayload>,
): Promise<InstitutionalPageAdmin> {
  const res = await fetch(`${API}/admin/pages/${id}`, {
    method: 'PATCH',
    headers: clientHdrs(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string | string[] }).message?.toString() ?? 'Erro ao atualizar',
    );
  }
  return normalizeAdminPage(await res.json());
}

export async function deleteAdminPage(id: string): Promise<void> {
  const res = await fetch(`${API}/admin/pages/${id}`, {
    method: 'DELETE',
    headers: clientHdrs(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Erro ao excluir');
}

export async function toggleAdminPageActive(id: string): Promise<InstitutionalPageAdmin> {
  const res = await fetch(`${API}/admin/pages/${id}/toggle-active`, {
    method: 'PATCH',
    headers: clientHdrs(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Erro ao alternar status');
  return normalizeAdminPage(await res.json());
}
