import { cn } from '@/lib/utils';
import { AdminSidebarNav } from './admin-sidebar-nav';

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  return (
    <aside className={cn('flex w-60 flex-col border-r border-flor-100 bg-white', className)}>
      <div className="flex h-16 items-center border-b border-flor-100 px-6">
        <span className="font-serif text-lg font-semibold text-flor-800 tracking-wide">
          Flor de Menina
        </span>
      </div>
      <AdminSidebarNav onNavigate={onNavigate} />
    </aside>
  );
}
