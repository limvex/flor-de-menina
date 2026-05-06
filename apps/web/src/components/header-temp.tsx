'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/use-auth';

export function HeaderTemp() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <header className="bg-white border-b border-flor-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-serif text-xl text-flor-800 tracking-wide">
            Flor de Menina
          </Link>
          <div className="w-20 h-4 bg-flor-100 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-flor-100 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-flor-800 tracking-wide">
          Flor de Menina
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-sm text-flor-700 hover:text-flor-900 transition"
            >
              <span className="w-7 h-7 bg-flor-200 rounded-full flex items-center justify-center text-xs font-medium text-flor-800">
                {user.name[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline">Olá, {user.name.split(' ')[0]}</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-flor-100 py-1 z-20">
                  <Link
                    href="/minha-conta"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-flor-700 hover:bg-flor-50 transition"
                  >
                    Minha conta
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-flor-700 hover:bg-flor-50 transition"
                  >
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-flor-600 hover:text-flor-800 transition">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="text-sm px-4 py-2 rounded-lg bg-flor-700 hover:bg-flor-800 text-white transition"
            >
              Cadastrar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
