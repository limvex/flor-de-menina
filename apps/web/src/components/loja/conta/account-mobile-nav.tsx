'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth';
import { toast } from 'sonner';

const navItems = [
  { label: 'Conta', href: '/conta' },
  { label: 'Pedidos', href: '/conta/pedidos' },
  { label: 'Favoritos', href: '/conta/favoritos' },
  { label: 'Endereços', href: '/conta/enderecos' },
  { label: 'Perfil', href: '/conta/perfil' },
];

export function AccountMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleChange = async (value: string) => {
    if (value === 'logout') {
      try {
        await logout();
        router.push('/');
      } catch {
        toast.error('Erro ao sair');
      }
      return;
    }
    router.push(value);
  };

  const current =
    navItems.find(({ href }) => href !== '/conta' && pathname.startsWith(href))?.href ??
    (pathname === '/conta' ? '/conta' : '/conta');

  return (
    <div className="lg:hidden mb-6">
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-flor-400"
        aria-label="Navegação da conta"
      >
        {navItems.map(({ label, href }) => (
          <option key={href} value={href}>
            {label}
          </option>
        ))}
        <option value="logout">Sair</option>
      </select>
    </div>
  );
}
