import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Flor de Menina — Moda Feminina em Maceió',
};

export default function HomePage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center bg-bege-50 px-4 text-center">
      <p className="mb-4 font-sans text-[11px] font-medium tracking-[0.2em] uppercase text-flor-400">
        Moda Feminina · Maceió – AL
      </p>
      <h1 className="font-serif text-5xl font-normal tracking-[0.18em] uppercase text-flor-800 md:text-7xl">
        Flor de Menina
      </h1>
      <div className="my-6 h-px w-16 bg-flor-300" />
      <p className="max-w-sm font-sans text-base leading-relaxed text-flor-500">
        Em breve, novidades incríveis.
      </p>
      <Link
        href="/lancamentos"
        className="mt-8 inline-flex items-center justify-center rounded-full border border-flor-600 px-10 py-3.5 font-sans text-xs font-medium tracking-[0.2em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
      >
        Explorar
      </Link>
    </section>
  );
}
