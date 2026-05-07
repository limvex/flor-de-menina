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
        <Button variant="outline" render={<Link href="/admin/dashboard" />}>
          Voltar para o Dashboard
        </Button>
      }
    />
  );
}
