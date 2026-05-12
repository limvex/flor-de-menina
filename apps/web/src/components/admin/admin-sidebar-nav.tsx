'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { navItems } from './nav-config';

interface AdminSidebarNavProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function AdminSidebarNav({ onNavigate, collapsed = false }: AdminSidebarNavProps) {
  const pathname = usePathname();

  const linkClass = (isActive: boolean) =>
    cn(
      'flex items-center rounded-lg text-sm font-medium transition-colors touch-manipulation min-h-11',
      collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
      isActive ? 'bg-flor-100 text-flor-800' : 'text-flor-600 hover:bg-flor-50 hover:text-flor-800',
    );

  const inner = navItems.map(({ label, href, icon: Icon }) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');

    const link = (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        className={linkClass(isActive)}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden="true" />
        {!collapsed && <span>{label}</span>}
        {collapsed && <span className="sr-only">{label}</span>}
      </Link>
    );

    if (!collapsed) {
      return link;
    }

    return (
      <Tooltip.Root key={href} delayDuration={200}>
        <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={6}
            className="z-[60] rounded-md bg-flor-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md animate-in fade-in-0 zoom-in-95"
          >
            {label}
            <Tooltip.Arrow className="fill-flor-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  });

  return (
    <Tooltip.Provider delayDuration={200}>
      <nav aria-label="Navegação principal" className="flex flex-1 flex-col px-2 py-3 space-y-0.5">
        {inner}
      </nav>
    </Tooltip.Provider>
  );
}
