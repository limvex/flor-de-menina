import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center py-32 text-center">
      <h1 className="font-serif text-4xl text-flor-900">Produto não encontrado</h1>
      <p className="mt-4 text-flor-600">
        O produto que você está procurando não existe ou foi removido.
      </p>
      <Link
        href="/produtos"
        className="mt-8 rounded bg-flor-800 px-6 py-3 text-white hover:bg-flor-900 transition-colors"
      >
        Ver todos os produtos
      </Link>
    </div>
  );
}
