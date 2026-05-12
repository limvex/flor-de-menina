'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AdminSidebarNav } from './admin-sidebar-nav';

export type AdminSidebarVariant = 'desktop' | 'drawer';

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
  /** Desktop: largura ícone vs texto. Drawer: sempre expandido. */
  collapsed?: boolean;
  variant?: AdminSidebarVariant;
}

export function AdminSidebar({
  className,
  onNavigate,
  collapsed = false,
  variant = 'desktop',
}: AdminSidebarProps) {
  const isDrawer = variant === 'drawer';
  const narrow = !isDrawer && collapsed;

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-flor-100 bg-white transition-[width] duration-200 ease-out',
        narrow ? 'w-[4.5rem]' : 'w-60',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-flor-100',
          narrow ? 'justify-center px-2' : 'justify-between gap-2 px-5',
        )}
      >
        {narrow ? (
          <span
            className="font-serif text-xl font-semibold text-flor-800"
            aria-hidden="true"
            title="Flor de Menina"
          >
            F
          </span>
        ) : (
          <>
            <span className="font-serif text-lg font-semibold tracking-wide text-flor-800 truncate min-w-0">
              Flor de Menina
            </span>
            {isDrawer && (
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 touch-manipulation text-flor-600"
                    aria-label="Fechar menu"
                  />
                }
              >
                <X className="size-5" />
              </SheetClose>
            )}
          </>
        )}
      </div>
      <AdminSidebarNav onNavigate={onNavigate} collapsed={narrow} />
      {!narrow && (
        <div className="mt-auto border-t border-flor-100 px-5 py-3">
          <p className="text-[11px] text-flor-300">Limvex © 2026</p>
        </div>
      )}
    </aside>
  );
}
