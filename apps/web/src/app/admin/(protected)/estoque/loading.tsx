export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-40 bg-flor-100 rounded animate-pulse" />
      <div className="h-10 w-full bg-flor-100 rounded animate-pulse" />
      <div className="rounded-xl border border-flor-100 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-flor-50 bg-white animate-pulse" />
        ))}
      </div>
    </div>
  );
}
