import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/admin/empty-state';

export default function AdminNotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Página não encontrada"
      description="A página que você tentou acessar não existe ou foi removida."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" render={<Link href="/admin/dashboard" />} nativeButton={false}>
            Voltar ao painel
          </Button>
          <Button render={<Link href="/" />} nativeButton={false}>
            Voltar à loja
          </Button>
        </div>
      }
    />
  );
}
