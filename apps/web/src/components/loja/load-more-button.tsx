'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  hasMore: boolean;
}

export function LoadMoreButton({ onClick, loading, hasMore }: LoadMoreButtonProps) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-12">
      <Button
        variant="outline"
        size="lg"
        onClick={onClick}
        disabled={loading}
        className="min-w-48 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : (
          'Carregar mais'
        )}
      </Button>
    </div>
  );
}
