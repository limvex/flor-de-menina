'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-destructive" />
      <h2 className="font-serif text-xl text-flor-800">Algo deu errado</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {error.message ?? 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={reset}>
          Tentar novamente
        </Button>
        <Button variant="ghost" render={<Link href="/admin/dashboard" />}>
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
}
