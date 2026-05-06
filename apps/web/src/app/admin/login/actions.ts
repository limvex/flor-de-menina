'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Preencha e-mail e senha.' };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { error: 'Não foi possível conectar à API. Tente novamente.' };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) return { error: 'Muitas tentativas. Aguarde alguns minutos.' };
    return { error: (body as { message?: string }).message ?? 'Credenciais inválidas.' };
  }

  const setCookieHeader = res.headers.getSetCookie();
  const cookieStore = await cookies();

  for (const raw of setCookieHeader) {
    const [nameValue, ...directives] = raw.split(';').map((s) => s.trim());
    const eqIdx = nameValue.indexOf('=');
    const name = nameValue.slice(0, eqIdx);
    const value = nameValue.slice(eqIdx + 1);

    const opts: Parameters<typeof cookieStore.set>[2] = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    };

    for (const dir of directives) {
      const lower = dir.toLowerCase();
      if (lower.startsWith('max-age=')) opts.maxAge = Number(dir.split('=')[1]);
      if (lower.startsWith('path=')) opts.path = dir.split('=')[1];
      if (lower === 'secure') opts.secure = true;
    }

    cookieStore.set(name, value, opts);
  }

  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  try {
    await fetch(`${API_URL}/auth/admin/logout`, {
      method: 'POST',
      headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
    });
  } catch {
    // ignora erros de rede no logout
  }

  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');

  redirect('/admin/login');
}
