import type { Metadata } from 'next';
import Link from 'next/link';
import { User } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Minha Conta — Flor de Menina' };

export default function ContaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <h1 className="mb-10 font-serif text-3xl font-normal tracking-[0.12em] uppercase text-flor-800">
        Minha Conta
      </h1>
      <EmptyState
        icon={User}
        title="Faça login para acessar sua conta"
        description="Entre para visualizar seus pedidos, endereços e muito mais."
        action={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-white transition-colors hover:bg-flor-700"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center rounded-full border border-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
            >
              Criar conta
            </Link>
          </div>
        }
      />
    </div>
  );
}
