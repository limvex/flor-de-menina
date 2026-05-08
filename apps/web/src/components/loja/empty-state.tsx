import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  searchTerm?: string;
  onClearFilters?: () => void;
}

export function EmptyState({ searchTerm, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <SearchX className="mb-4 h-12 w-12 text-stone-300" />
      <h3 className="font-serif text-xl text-stone-700 mb-2">
        {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum produto encontrado'}
      </h3>
      <p className="text-sm text-stone-500 max-w-sm mb-6">
        {searchTerm
          ? 'Tente buscar por outro termo ou navegue pelas categorias.'
          : 'Tente ajustar os filtros para encontrar o que procura.'}
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
