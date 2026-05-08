interface ResultCountProps {
  total: number;
  loading?: boolean;
}

export function ResultCount({ total, loading }: ResultCountProps) {
  if (loading) return <span className="text-sm text-stone-400">Buscando...</span>;
  return (
    <span className="text-sm text-stone-500">
      <strong className="text-stone-900">{total.toLocaleString('pt-BR')}</strong>{' '}
      {total === 1 ? 'produto encontrado' : 'produtos encontrados'}
    </span>
  );
}
