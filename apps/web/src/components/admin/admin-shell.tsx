'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AdminLayoutProvider, useAdminLayout } from './admin-layout-context';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { ChangePasswordModal } from './change-password-modal';
import type { AdminUser } from '@flor/types';

interface AdminShellProps {
  user: AdminUser;
  children: React.ReactNode;
}

function AdminShellInner({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(user.mustChangePassword);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const { sidebarCollapsed } = useAdminLayout();

  // Evita scroll duplo: conteúdo longo em <main> não pode encadear scroll no <html>.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <>
      <ChangePasswordModal
        open={changePwOpen}
        onOpenChange={setChangePwOpen}
        onSuccess={() => setShowBanner(false)}
      />
      <div className="flex h-dvh min-h-0 overflow-hidden bg-flor-50">
        <AdminSidebar
          className="hidden lg:flex shrink-0"
          collapsed={sidebarCollapsed}
          variant="desktop"
        />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-[min(20rem,calc(100vw-0.75rem))] max-w-[min(20rem,100vw)] border-r border-flor-100 p-0 pt-[env(safe-area-inset-top,0px)] data-[side=left]:w-[min(20rem,calc(100vw-0.75rem))]"
          >
            <AdminSidebar variant="drawer" onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader user={user} onMenuClick={() => setMobileOpen(true)} />
          {showBanner && (
            <div className="relative z-0 flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Você está usando uma senha temporária. Troque-a antes de continuar.
              </span>
              <button
                onClick={() => setChangePwOpen(true)}
                className="shrink-0 font-medium underline underline-offset-2 hover:text-amber-900"
              >
                Trocar agora
              </button>
            </div>
          )}
          <main
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-none px-4 pt-4 lg:px-6 lg:pt-6',
              showBanner ? 'max-sm:pt-5 pb-24 sm:pb-12' : 'pb-12',
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <AdminLayoutProvider>
      <AdminShellInner user={user}>{children}</AdminShellInner>
    </AdminLayoutProvider>
  );
}
