import { Skeleton } from '@/components/ui/skeleton';

export default function FreteLoading() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-xl border border-flor-100 bg-white p-6">
          <Skeleton className="mb-4 h-5 w-48" />
          <Skeleton className="mb-6 h-px w-full" />
          <div className="space-y-3">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
