'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Heart, User, Menu } from 'lucide-react';
import { NavMenu } from './nav-menu';
import { MobileDrawer } from './mobile-drawer';
import { CartBadge } from './cart-badge';
import { HeaderSearch } from './header-search';
import { MiniCart } from './mini-cart';
import { useCart } from '@/contexts/cart-context';

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-flor-100 bg-background/95 backdrop-blur-sm">
      <div className="relative mx-auto flex max-w-7xl items-center px-4 lg:px-8">
        {/* Left column — hamburger (mobile) / logo (desktop) */}
        <div className="flex flex-1 items-center lg:flex-none">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden -ml-2 p-2 text-flor-700 transition-colors hover:text-flor-900"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="hidden lg:block font-serif text-xl font-normal tracking-[0.2em] uppercase text-flor-800 transition-colors hover:text-flor-900"
          >
            FLOR DE MENINA
          </Link>
        </div>

        {/* Center column — logo (mobile) / nav (desktop) */}
        <div className="flex h-[60px] items-center lg:h-[72px] lg:flex-1 lg:justify-center">
          <Link
            href="/"
            className="lg:hidden font-serif text-lg font-normal tracking-[0.2em] uppercase text-flor-800 transition-colors hover:text-flor-900"
          >
            FLOR DE MENINA
          </Link>
          <NavMenu />
        </div>

        {/* Right column — actions */}
        <div className="flex flex-1 items-center justify-end gap-0.5 lg:flex-none">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-flor-500 transition-colors hover:text-flor-700"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/wishlist"
            className="hidden p-2 text-flor-500 transition-colors hover:text-flor-700 lg:flex"
            aria-label="Lista de desejos"
          >
            <Heart className="h-5 w-5" />
          </Link>

          <Link
            href="/conta"
            className="hidden p-2 text-flor-500 transition-colors hover:text-flor-700 lg:flex"
            aria-label="Minha conta"
          >
            <User className="h-5 w-5" />
          </Link>

          <CartBadge count={itemCount} onClick={openCart} />
        </div>

        {/* Search overlay */}
        {searchOpen && <HeaderSearch onClose={() => setSearchOpen(false)} />}
      </div>

      {/* Mobile navigation drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Mini-cart drawer */}
      <MiniCart />
    </header>
  );
}
