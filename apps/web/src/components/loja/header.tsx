'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const [scrolled, setScrolled] = useState(false);
  const { itemCount, openCart } = useCart();
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTransparent = isHome && !scrolled;

  return (
    <header
      className={`fixed top-8 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent ? 'bg-transparent' : 'bg-white border-b border-flor-100 shadow-sm'
      }`}
    >
      <div className="relative mx-auto flex max-w-7xl items-center px-4 lg:px-8">
        {/* Left column — hamburger (mobile) / logo (desktop) */}
        <div className="flex flex-1 items-center lg:flex-none">
          <button
            onClick={() => setDrawerOpen(true)}
            className={`lg:hidden -ml-2 p-2 transition-colors ${
              isTransparent ? 'text-white hover:text-white/70' : 'text-flor-700 hover:text-flor-900'
            }`}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className={`hidden lg:block font-serif text-xl font-normal tracking-[0.2em] uppercase transition-colors ${
              isTransparent ? 'text-white hover:text-white/70' : 'text-flor-800 hover:text-flor-900'
            }`}
          >
            FLOR DE MENINA
          </Link>
        </div>

        {/* Center column — logo (mobile) / nav (desktop) */}
        <div className="flex h-[60px] items-center lg:h-[72px] lg:flex-1 lg:justify-center">
          <Link
            href="/"
            className={`lg:hidden font-serif text-lg font-normal tracking-[0.2em] uppercase transition-colors ${
              isTransparent ? 'text-white hover:text-white/70' : 'text-flor-800 hover:text-flor-900'
            }`}
          >
            FLOR DE MENINA
          </Link>
          <NavMenu isTransparent={isTransparent} />
        </div>

        {/* Right column — actions */}
        <div className="flex flex-1 items-center justify-end gap-0.5 lg:flex-none">
          <button
            onClick={() => setSearchOpen(true)}
            className={`p-2 transition-colors ${
              isTransparent ? 'text-white hover:text-white/70' : 'text-flor-500 hover:text-flor-700'
            }`}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/wishlist"
            className={`hidden p-2 transition-colors lg:flex ${
              isTransparent ? 'text-white hover:text-white/70' : 'text-flor-500 hover:text-flor-700'
            }`}
            aria-label="Lista de desejos"
          >
            <Heart className="h-5 w-5" />
          </Link>

          <Link
            href="/conta"
            className={`hidden p-2 transition-colors lg:flex ${
              isTransparent ? 'text-white hover:text-white/70' : 'text-flor-500 hover:text-flor-700'
            }`}
            aria-label="Minha conta"
          >
            <User className="h-5 w-5" />
          </Link>

          <CartBadge count={itemCount} onClick={openCart} isTransparent={isTransparent} />
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
