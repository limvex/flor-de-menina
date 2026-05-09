import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-flor-100 h-16" />
      <div className="border-b border-flor-100 h-16" />
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
