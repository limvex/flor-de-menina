'use client';

import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import type { AdminUser } from '@flor/types';

interface AdminShellProps {
  user: AdminUser;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-flor-50">
      {/* Desktop sidebar */}
      <AdminSidebar className="hidden lg:flex" />

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0" aria-label="Menu de navegação">
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
