import { cookies } from 'next/headers';
import type { AdminUser } from '@flor/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function requireAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const user = (await res.json()) as {
      id: string;
      email: string;
      name: string;
      role: string;
    };

    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') return null;

    return user as AdminUser;
  } catch {
    return null;
  }
}
