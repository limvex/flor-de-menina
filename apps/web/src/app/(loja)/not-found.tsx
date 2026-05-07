import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export default function LojaNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
      <EmptyState
        icon={SearchX}
        title="Página não encontrada"
        description="A página que você procura não existe ou foi removida."
        action={
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
          >
            Voltar para Home
          </Link>
        }
      />
    </div>
  );
}
