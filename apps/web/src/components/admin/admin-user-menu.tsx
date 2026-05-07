'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutAction } from '@/app/admin/login/actions';
import type { AdminUser } from '@flor/types';

interface AdminUserMenuProps {
  user: AdminUser;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function AdminUserMenu({ user }: AdminUserMenuProps) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    toast.success('Sessão encerrada');
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-flor-700 hover:bg-flor-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-flor-400"
      >
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-flor-100 text-flor-700 text-xs">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline max-w-32 truncate">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-flor-800">{user.name}</span>
              <span className="text-xs text-flor-400 truncate">{user.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<a href="#" />}>
            <User className="h-4 w-4" aria-hidden="true" />
            Perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
