'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Heart, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { navItems } from './nav-config';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="left" className="flex w-[85vw] max-w-sm flex-col p-0 bg-background">
        <SheetHeader className="px-6 pb-4 pt-8">
          <SheetTitle className="font-serif text-2xl tracking-wide text-flor-800 text-left">
            OLÁ!
          </SheetTitle>
          <SheetDescription className="font-sans text-sm text-flor-500 text-left">
            Entre ou cadastre-se na sua conta
          </SheetDescription>
          <Link
            href="/conta"
            onClick={onClose}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-white transition-colors hover:bg-flor-700"
          >
            ENTRAR
          </Link>
        </SheetHeader>

        <Separator />

        <nav aria-label="Menu mobile" className="flex-1 overflow-y-auto px-6 py-4">
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

        <Separator />

        <div className="flex gap-4 px-6 py-4">
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center gap-2 font-sans text-sm text-flor-600 transition-colors hover:text-flor-900"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            Wishlist
          </Link>
          <Link
            href="/conta"
            onClick={onClose}
            className="flex items-center gap-2 font-sans text-sm text-flor-600 transition-colors hover:text-flor-900"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            Minha conta
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
