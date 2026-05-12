'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AdminLayoutProvider, useAdminLayout } from './admin-layout-context';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import type { AdminUser } from '@flor/types';

interface AdminShellProps {
  user: AdminUser;
  children: React.ReactNode;
}

function AdminShellInner({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed } = useAdminLayout();

  return (
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 lg:px-6 lg:pb-6 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <AdminLayoutProvider>
      <AdminShellInner user={user}>{children}</AdminShellInner>
    </AdminLayoutProvider>
  );
}
