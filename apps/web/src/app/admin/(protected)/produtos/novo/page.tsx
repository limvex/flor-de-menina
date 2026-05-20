'use client';

import { NewProductForm } from './components/new-product-form';
import { useCategories } from '@/hooks/use-products';

export default function NovoProdutoPage() {
  const { data: categories = [] } = useCategories();

  return <NewProductForm categories={categories} />;
}
