import { Skeleton } from '@/components/ui/skeleton';

export default function CarrinhoLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Skeleton className="mb-8 h-9 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
