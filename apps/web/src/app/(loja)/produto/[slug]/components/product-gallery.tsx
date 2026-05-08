'use client';

import Image from 'next/image';
import { useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

interface ProductImage {
  url: string;
  alt?: string | null;
}

interface Props {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const scrollTo = (index: number) => {
    setSelectedIndex(index);
    emblaApi?.scrollTo(index);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-stone-100 flex items-center justify-center rounded">
        <span className="text-stone-400">Sem imagens</span>
      </div>
    );
  }

  return (
    <div className="md:sticky md:top-24">
      {/* Mobile: carousel com swipe */}
      <div className="md:hidden">
        <div ref={emblaRef} className="overflow-hidden rounded">
          <div className="flex">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-[3/4] w-full flex-[0_0_100%]">
                <Image
                  src={img.url}
                  alt={img.alt ?? productName}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Imagem ${i + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === selectedIndex ? 'bg-stone-700' : 'bg-stone-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: imagem grande + thumbnails */}
      <div className="hidden md:block">
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 rounded">
          <Zoom>
            <div className="relative aspect-[3/4]">
              <Image
                src={images[selectedIndex]?.url ?? ''}
                alt={images[selectedIndex]?.alt ?? productName}
                fill
                sizes="(max-width: 1024px) 50vw, 600px"
                className="object-cover"
                priority
              />
            </div>
          </Zoom>
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`relative aspect-[3/4] overflow-hidden border-2 transition-all rounded ${
                  i === selectedIndex
                    ? 'border-stone-700'
                    : 'border-transparent hover:border-stone-400'
                }`}
              >
                <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
