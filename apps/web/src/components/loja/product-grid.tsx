import { ProductCard } from './product-card';
import type { PublicProduct } from '@/lib/api/products-public';

interface ProductGridProps {
  products: PublicProduct[];
  onQuickView?: (productId: string) => void;
}

export function ProductGrid({ products, onQuickView }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onQuickView={onQuickView} />
      ))}
    </div>
  );
}
