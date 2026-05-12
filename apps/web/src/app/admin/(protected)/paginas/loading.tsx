import { Skeleton } from '@/components/ui/skeleton';

export default function PaginasLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="rounded-xl border border-flor-100 overflow-hidden">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full border-t border-flor-50" />
        ))}
      </div>
    </div>
  );
}
