'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Heart, MapPin, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/use-auth';
import { toast } from 'sonner';

const navItems = [
  { label: 'Minha conta', href: '/conta', icon: LayoutDashboard },
  { label: 'Meus pedidos', href: '/conta/pedidos', icon: Package },
  { label: 'Favoritos', href: '/conta/favoritos', icon: Heart },
  { label: 'Endereços', href: '/conta/enderecos', icon: MapPin },
  { label: 'Perfil', href: '/conta/perfil', icon: User },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch {
      toast.error('Erro ao sair');
    }
  };

  return (
    <nav className="hidden lg:block w-60 shrink-0">
      <ul className="space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/conta' && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-flor-100 text-flor-800 font-medium'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border-t pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-flor-600 transition-colors hover:bg-flor-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </nav>
  );
}
