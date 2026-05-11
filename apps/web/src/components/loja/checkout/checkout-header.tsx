'use client';

import Link from 'next/link';

export function CheckoutHeader() {
  return (
    <header className="border-b border-flor-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="font-serif text-xl font-normal tracking-widest text-flor-800">
          Flor de Menina
        </Link>
      </div>
    </header>
  );
}
