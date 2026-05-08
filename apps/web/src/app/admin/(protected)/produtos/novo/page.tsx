'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductForm } from '../components/product-form';
import { useCategories } from '@/hooks/use-products';

export default function NovoProdutoPage() {
  const { data: categories = [] } = useCategories();

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
          <h1 className="font-serif text-2xl text-flor-800">Novo produto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Preencha as informações abaixo</p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
