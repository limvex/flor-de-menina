'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Heart, User, LogOut, Package, MapPin, LayoutDashboard } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { navItems } from './nav-config';
import { useAuth } from '@/lib/auth/use-auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const accountLinks = [
  { label: 'Minha conta', href: '/conta', icon: LayoutDashboard },
  { label: 'Meus pedidos', href: '/conta/pedidos', icon: Package },
  { label: 'Favoritos', href: '/conta/favoritos', icon: Heart },
  { label: 'Endereços', href: '/conta/enderecos', icon: MapPin },
  { label: 'Perfil', href: '/conta/perfil', icon: User },
];

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
      router.push('/');
    } catch {
      toast.error('Erro ao sair');
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="left" className="flex w-[85vw] max-w-sm flex-col p-0 bg-background">
        <SheetHeader className="px-6 pb-4 pt-8">
          {user ? (
            <>
              <SheetTitle className="font-serif text-2xl tracking-wide text-flor-800 text-left">
                Olá, {user.name.split(' ')[0]}!
              </SheetTitle>
              <SheetDescription className="font-sans text-sm text-flor-500 text-left">
                {user.email}
              </SheetDescription>
              <Link
                href="/conta"
                onClick={onClose}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-white transition-colors hover:bg-flor-700"
              >
                MINHA CONTA
              </Link>
            </>
          ) : (
            <>
              <SheetTitle className="font-serif text-2xl tracking-wide text-flor-800 text-left">
                OLÁ!
              </SheetTitle>
              <SheetDescription className="font-sans text-sm text-flor-500 text-left">
                Entre ou cadastre-se na sua conta
              </SheetDescription>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center rounded-full bg-flor-600 px-4 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-white transition-colors hover:bg-flor-700"
                >
                  ENTRAR
                </Link>
                <Link
                  href="/cadastro"
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center rounded-full border border-flor-600 px-4 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
                >
                  CADASTRAR
                </Link>
              </div>
            </>
          )}
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto">
          {/* Navegação da loja */}
          <nav aria-label="Menu mobile" className="px-6 py-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-flor-400">
              Loja
            </p>
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button
                    onClick={() => setCategoryOpen((v) => !v)}
                    className="flex w-full items-center justify-between py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-700 transition-colors hover:text-flor-900"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {categoryOpen && (
                    <div className="space-y-1 pb-2 pl-4">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className="block py-2 font-sans text-sm text-flor-600 transition-colors hover:text-flor-900"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={onClose}
                  className="block py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-700 transition-colors hover:text-flor-900"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* Navegação da conta (só quando logado) */}
          {user && (
            <>
              <Separator />
              <nav aria-label="Minha conta" className="px-6 py-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-flor-400">
                  Minha conta
                </p>
                {accountLinks.map(({ label, href, icon: Icon }) => {
                  const active =
                    pathname === href || (href !== '/conta' && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 py-3 font-sans text-sm transition-colors',
                        active ? 'font-medium text-flor-800' : 'text-flor-600 hover:text-flor-900',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        <Separator />

        <div className="px-6 py-4">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 font-sans text-sm text-flor-600 transition-colors hover:text-flor-900"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair da conta
            </button>
          ) : (
            <Link
              href="/conta"
              onClick={onClose}
              className="flex items-center gap-2 font-sans text-sm text-flor-600 transition-colors hover:text-flor-900"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Minha conta
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
