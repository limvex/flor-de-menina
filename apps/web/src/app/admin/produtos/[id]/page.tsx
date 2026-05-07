'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { ProductForm } from '../components/product-form';
import { useProduct, useCategories } from '@/hooks/use-products';

export default function EditarProdutoPage() {
  const params = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(params.id);
  const { data: categories = [] } = useCategories();

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Carregando produto...</div>;
  }

  if (error || !product) {
    return <div className="py-12 text-center text-destructive">Produto não encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/produtos"
          className="text-muted-foreground hover:text-flor-700 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-flor-800">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Editando produto — <span className="font-mono">{product.slug}</span>
          </p>
        </div>
      </div>

      <ProductForm product={product} categories={categories} />
    </div>
  );
}
