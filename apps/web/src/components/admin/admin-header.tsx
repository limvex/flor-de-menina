'use client';

import { Menu, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminBreadcrumbs } from './admin-breadcrumbs';
import { AdminUserMenu } from './admin-user-menu';
import { useAdminLayout } from './admin-layout-context';
import type { AdminUser } from '@flor/types';

interface AdminHeaderProps {
  user: AdminUser;
  onMenuClick: () => void;
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  const { sidebarCollapsed, toggleSidebar } = useAdminLayout();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-flor-100 bg-white px-3 pt-[env(safe-area-inset-top,0px)] sm:h-16 sm:gap-3 sm:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 touch-manipulation text-flor-600 lg:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menu de navegação"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 touch-manipulation text-flor-600 lg:inline-flex"
        onClick={toggleSidebar}
        type="button"
        aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        aria-pressed={sidebarCollapsed}
      >
        {sidebarCollapsed ? (
          <PanelLeft className="h-5 w-5" aria-hidden />
        ) : (
          <PanelLeftClose className="h-5 w-5" aria-hidden />
        )}
      </Button>

      <div className="min-w-0 flex-1">
        <AdminBreadcrumbs />
      </div>
      <AdminUserMenu user={user} />
    </header>
  );
}
