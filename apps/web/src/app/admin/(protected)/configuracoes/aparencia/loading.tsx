import { Skeleton } from '@/components/ui/skeleton';

export default function AparenciaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-flor-100 bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
