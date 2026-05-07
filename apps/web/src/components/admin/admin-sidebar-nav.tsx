'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItems } from './nav-config';

interface AdminSidebarNavProps {
  onNavigate?: () => void;
}

export function AdminSidebarNav({ onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-flor-100 text-flor-800'
                : 'text-flor-600 hover:bg-flor-50 hover:text-flor-800',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
