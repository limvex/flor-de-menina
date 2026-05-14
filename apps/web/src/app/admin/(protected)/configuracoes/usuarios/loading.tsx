import { Skeleton } from '@/components/ui/skeleton';

export default function UsuariosLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="rounded-xl border border-flor-100 bg-white overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-flor-50 last:border-0"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48 hidden sm:block" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
