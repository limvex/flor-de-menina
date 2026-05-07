'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminBreadcrumbs } from './admin-breadcrumbs';
import { AdminUserMenu } from './admin-user-menu';
import type { AdminUser } from '@flor/types';

interface AdminHeaderProps {
  user: AdminUser;
  onMenuClick: () => void;
}

export function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-flor-100 bg-white px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-flor-600"
        onClick={onMenuClick}
        aria-label="Abrir menu de navegação"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <AdminBreadcrumbs />
      </div>
      <AdminUserMenu user={user} />
    </header>
  );
}
