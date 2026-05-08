import { ProductCard } from '@/components/loja/product-card';
import type { PublicProduct } from '@/lib/api/products-public';
import type { RelatedProduct } from '@/lib/api/product-detail';

interface Props {
  products: RelatedProduct[];
}

export function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-stone-100 pt-12">
      <h2 className="mb-6 text-center font-serif text-2xl text-stone-900">
        Você também pode gostar
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p as unknown as PublicProduct} />
        ))}
      </div>
    </section>
  );
}
