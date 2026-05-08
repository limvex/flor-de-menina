import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface Props {
  onClose?: () => void;
}

export function EmptyCart({ onClose }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <ShoppingBag className="h-12 w-12 text-stone-300" aria-hidden="true" />
      <div>
        <p className="font-serif text-lg text-stone-700">Sua sacola está vazia</p>
        <p className="mt-1 text-sm text-stone-400">Adicione produtos para continuar</p>
      </div>
      <Link
        href="/produtos"
        onClick={onClose}
        className="mt-2 inline-flex items-center justify-center rounded-full border border-flor-600 px-6 py-2.5 text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
      >
        Ver produtos
      </Link>
    </div>
  );
}
