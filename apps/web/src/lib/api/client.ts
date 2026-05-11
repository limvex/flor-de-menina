const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

function formatApiErrorBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const b = body as { message?: unknown; error?: unknown };
  if (typeof b.message === 'string') return b.message;
  if (Array.isArray(b.message)) return b.message.join('. ');
  if (b.message && typeof b.message === 'object') {
    try {
      return JSON.stringify(b.message);
    } catch {
      return fallback;
    }
  }
  if (typeof b.error === 'string') return b.error;
  return fallback;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiErrorBody(err, res.statusText));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestInit) => apiFetch<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    apiFetch<T>(path, {
      ...opts,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    apiFetch<T>(path, {
      ...opts,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    apiFetch<T>(path, {
      ...opts,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, opts?: RequestInit) => apiFetch<T>(path, { ...opts, method: 'DELETE' }),

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message ?? res.statusText);
    }

    return res.json() as Promise<T>;
  },
};
