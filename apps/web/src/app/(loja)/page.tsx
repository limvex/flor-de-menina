import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/loja/product-card';
import { listPublicProducts } from '@/lib/api/products-public';

export const metadata: Metadata = {
  title: 'Flor de Menina — Moda Feminina em Maceió',
};

export default async function HomePage() {
  const featured = await listPublicProducts({ limit: 8, sort: 'featured' }).catch(() => null);

  return (
    <>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center bg-bege-50 px-4 py-20 text-center">
        <p className="mb-4 font-sans text-[11px] font-medium tracking-[0.2em] uppercase text-flor-400">
          Moda Feminina · Maceió – AL
        </p>
        <h1 className="font-serif text-5xl font-normal tracking-[0.18em] uppercase text-flor-800 md:text-7xl">
          Flor de Menina
        </h1>
        <div className="my-6 h-px w-16 bg-flor-300" />
        <p className="max-w-sm font-sans text-base leading-relaxed text-flor-500">
          Moda feminina com estilo e personalidade.
        </p>
        <Link
          href="/produtos"
          className="mt-8 inline-flex items-center justify-center rounded-full border border-flor-600 px-10 py-3.5 font-sans text-xs font-medium tracking-[0.2em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
        >
          Ver coleção
        </Link>
      </section>

      {/* Produtos em destaque */}
      {featured && featured.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-2xl font-normal tracking-[0.12em] uppercase text-flor-800">
              Destaques
            </h2>
            <Link
              href="/produtos"
              className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-500 hover:text-flor-800 transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {featured.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
