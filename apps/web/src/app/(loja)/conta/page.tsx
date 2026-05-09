'use client';

import Link from 'next/link';
import { Package, Heart, MapPin } from 'lucide-react';
import { useAccount } from '@/contexts/account-context';

export default function ContaDashboardPage() {
  const { profile } = useAccount();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-normal text-flor-800">
        Olá, {profile?.name?.split(' ')[0] ?? ''}!
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pedidos */}
        <div className="rounded-lg border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-flor-600" />
            <span className="text-sm font-medium text-stone-800">Últimos pedidos</span>
          </div>
          <p className="text-sm text-stone-500">Nenhum pedido ainda</p>
          <Link
            href="/conta/pedidos"
            className="mt-3 inline-flex text-xs font-medium text-flor-600 hover:underline"
          >
            Ver pedidos →
          </Link>
        </div>

        {/* Favoritos */}
        <FavoritosCard />

        {/* Endereço padrão */}
        <EnderecoCard />
      </div>
    </div>
  );
}

function FavoritosCard() {
  const { isInWishlist } = useAccount();
  void isInWishlist;
  return (
    <div className="rounded-lg border border-stone-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-flor-600" />
        <span className="text-sm font-medium text-stone-800">Favoritos</span>
      </div>
      <p className="text-sm text-stone-500">Produtos que você salvou</p>
      <Link
        href="/conta/favoritos"
        className="mt-3 inline-flex text-xs font-medium text-flor-600 hover:underline"
      >
        Ver favoritos →
      </Link>
    </div>
  );
}

function EnderecoCard() {
  return (
    <div className="rounded-lg border border-stone-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-flor-600" />
        <span className="text-sm font-medium text-stone-800">Endereço de entrega</span>
      </div>
      <p className="text-sm text-stone-500">Nenhum endereço cadastrado</p>
      <Link
        href="/conta/enderecos"
        className="mt-3 inline-flex text-xs font-medium text-flor-600 hover:underline"
      >
        Adicionar endereço →
      </Link>
    </div>
  );
}
