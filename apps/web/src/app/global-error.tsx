'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import './globals.css';
import { getUserFacingErrorMessage } from '@/lib/errors';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global error]', error.digest ?? error.message, error);
  }, [error]);

  const description = getUserFacingErrorMessage(error);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#faf8f6] px-4 py-16 font-sans text-stone-800 antialiased">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <h1 className="font-serif text-2xl text-stone-900">Algo deu errado</h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-full border border-stone-400 px-6 py-2.5 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-200"
              onClick={reset}
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              Voltar à loja
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
