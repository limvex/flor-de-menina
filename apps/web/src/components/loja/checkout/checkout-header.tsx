'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Lock } from 'lucide-react';

export function CheckoutHeader() {
  return (
    <header className="border-b border-flor-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Flor de Menina"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="ml-2 font-serif text-xl font-normal tracking-widest text-flor-800">
            Flor de Menina
          </span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-flor-500">
          <Lock className="h-4 w-4" aria-hidden="true" />
          <span>Compra segura</span>
        </div>
      </div>
    </header>
  );
}
