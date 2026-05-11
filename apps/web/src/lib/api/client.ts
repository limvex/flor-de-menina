import { ApiError, messageForHttpStatus, readErrorFromResponse } from '@/lib/errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new ApiError(messageForHttpStatus(0), 0, { cause });
    }
    throw cause;
  }

  if (!res.ok) {
    await readErrorFromResponse(res);
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
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
    } catch (cause) {
      if (cause instanceof TypeError) {
        throw new ApiError(messageForHttpStatus(0), 0, { cause });
      }
      throw cause;
    }

    if (!res.ok) {
      await readErrorFromResponse(res);
    }

    return res.json() as Promise<T>;
  },
};
