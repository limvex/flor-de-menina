import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

export default function CategoriasLoading() {
  return (
    <>
      <AdminPageHeader
        title="Categorias"
        description="Gerencie as categorias e tabelas de medidas."
      />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </>
  );
}
