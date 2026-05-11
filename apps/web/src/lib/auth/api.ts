const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

function extractApiMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Erro desconhecido';
  const m = (body as { message?: unknown }).message;
  if (typeof m === 'string') return m;
  if (Array.isArray(m)) return m.filter((x): x is string => typeof x === 'string').join(' ');
  return 'Erro desconhecido';
}

async function authFetch(path: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw {
      status: 0,
      message: `Não foi possível contatar a API em ${API_URL}. Verifique se o servidor Nest está rodando (pnpm dev:api).`,
    };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as unknown;
    throw { status: res.status, message: extractApiMessage(body) };
  }

  return res.json();
}

export const customerAuthApi = {
  register: (data: RegisterData) =>
    authFetch('/auth/customer/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: LoginData) =>
    authFetch('/auth/customer/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => authFetch('/auth/customer/logout', { method: 'POST' }),

  refresh: () => authFetch('/auth/customer/refresh', { method: 'POST' }),

  me: () => authFetch('/auth/customer/me'),

  verifyEmail: (token: string) =>
    authFetch('/auth/customer/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  resendVerification: (email: string) =>
    authFetch('/auth/customer/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    authFetch('/auth/customer/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    authFetch('/auth/customer/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  getGoogleUrl: () => authFetch('/auth/customer/google'),

  googleCallback: (code: string) =>
    authFetch('/auth/customer/google/callback', { method: 'POST', body: JSON.stringify({ code }) }),
};
