import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/admin/empty-state';

/** 404 em /admin/* que não corresponde a rota real (ex.: /admin/rota-inexistente). */
export default function AdminSegmentNotFound() {
  return (
    <div className="light min-h-[70vh] bg-[#faf8f6] px-4 py-16">
      <div className="mx-auto max-w-lg">
        <EmptyState
          icon={FileQuestion}
          title="Página não encontrada"
          description="Este endereço do painel não existe. Confira o link ou volte ao início."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                render={<Link href="/admin/dashboard" />}
                nativeButton={false}
              >
                Ir ao painel
              </Button>
              <Button render={<Link href="/" />} nativeButton={false}>
                Voltar à loja
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
