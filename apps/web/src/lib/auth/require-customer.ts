import { cookies } from 'next/headers';
import type { CustomerUser } from './auth-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function requireCustomer(): Promise<CustomerUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('flor_customer_token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/auth/customer/me`, {
      headers: { Cookie: `flor_customer_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as CustomerUser;
  } catch {
    return null;
  }
}
