import { ApiError, messageForHttpStatus, readErrorFromResponse } from '@/lib/errors';

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

async function authFetch(path: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      if (process.env.NODE_ENV === 'development') {
        throw new ApiError(
          `Não foi possível contatar a API em ${API_URL}. Verifique se o servidor Nest está rodando (pnpm dev:api).`,
          0,
          { cause },
        );
      }
      throw new ApiError(messageForHttpStatus(0), 0, { cause });
    }
    throw cause;
  }

  if (!res.ok) {
    await readErrorFromResponse(res);
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
