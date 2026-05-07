export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-flor-100 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-flor-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="rounded-xl border border-flor-100 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-flor-50 bg-white animate-pulse" />
        ))}
      </div>
    </div>
  );
}
