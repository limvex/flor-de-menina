import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/loja/product-card';
import { listPublicProducts } from '@/lib/api/products-public';
import { fetchHomeContent } from '@/lib/api/home-content';

export async function HomePage() {
  const [content, featured] = await Promise.all([
    fetchHomeContent(),
    listPublicProducts({ limit: 8, sort: 'featured' }).catch(() => null),
  ]);

  const hasBannerCta = content.bannerButtonText && content.bannerButtonUrl;

  return (
    <>
      {/* Banner principal */}
      <section className="relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden bg-bege-50 px-4 py-20 text-center md:min-h-[420px]">
        {content.bannerImageUrl && (
          <Image
            src={content.bannerImageUrl}
            alt={content.bannerTitle ?? 'Banner Flor de Menina'}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className={`relative z-10 ${content.bannerImageUrl ? 'text-white drop-shadow' : ''}`}>
          {!content.bannerTitle && !content.bannerSubtitle && !content.bannerImageUrl && (
            <>
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
            </>
          )}
          {content.bannerTitle && (
            <h1 className="font-serif text-4xl font-normal tracking-[0.15em] uppercase md:text-6xl">
              {content.bannerTitle}
            </h1>
          )}
          {content.bannerSubtitle && (
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed opacity-90">
              {content.bannerSubtitle}
            </p>
          )}
          {hasBannerCta && (
            <Link
              href={content.bannerButtonUrl!}
              className="mt-8 inline-flex items-center justify-center rounded-full border border-current px-10 py-3.5 font-sans text-xs font-medium tracking-[0.2em] uppercase transition-colors hover:bg-white/20"
            >
              {content.bannerButtonText}
            </Link>
          )}
          {!hasBannerCta && !content.bannerTitle && !content.bannerSubtitle && (
            <Link
              href="/produtos"
              className="mt-8 inline-flex items-center justify-center rounded-full border border-flor-600 px-10 py-3.5 font-sans text-xs font-medium tracking-[0.2em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
            >
              Ver coleção
            </Link>
          )}
        </div>
      </section>

      {/* Destaques */}
      {featured && featured.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-2xl font-normal tracking-[0.12em] uppercase text-flor-800">
              Destaques
            </h2>
            <Link
              href="/produtos"
              className="font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-500 transition-colors hover:text-flor-800"
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

      {/* Sobre nós */}
      {(content.aboutTitle || content.aboutText) && (
        <section className="bg-bege-50 px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            {content.aboutTitle && (
              <h2 className="font-serif text-2xl font-normal tracking-[0.12em] uppercase text-flor-800">
                {content.aboutTitle}
              </h2>
            )}
            {content.aboutText && (
              <p className="mt-4 font-sans text-base leading-relaxed text-flor-600">
                {content.aboutText}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
