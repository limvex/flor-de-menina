import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logoutAction } from './login/actions';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function getAdminUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `access_token=${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ name: string; email: string; role: string }>;
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-flor-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="font-serif text-3xl text-flor-800">Painel Admin</h1>
        <p className="text-flor-600">
          Bem-vinda, <strong>{user.name}</strong>
        </p>
        <p className="text-sm text-flor-400">{user.email}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-4 px-6 py-2 rounded-lg bg-flor-700 hover:bg-flor-800 text-white text-sm font-medium transition"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
