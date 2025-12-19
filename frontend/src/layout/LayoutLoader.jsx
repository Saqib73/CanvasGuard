//left-bar links skeleton
const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse rounded-full bg-neutral-800/80 ${className}`}
  />
);

export const CardSkeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-neutral-900/80 ${className}`} />
);

export default function LayoutLoader() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* just gives a gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-yellow-500/5" />

      <div className="mx-auto max-w-7xl grid grid-cols-12 relative h-screen">
        {/* LEFT SIDEBAR */}
        <aside className="col-span-2 border-r border-neutral-800 p-4 space-y-6">
          <Skeleton className="h-6 w-32 mx-auto" />

          <div className="space-y-4 mt-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>

          <div className="space-y-4 pt-8">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="col-span-7 border-r border-neutral-800 p-6 space-y-6 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <CardSkeleton key={i} className="h-48 w-full" />
          ))}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="col-span-3 p-4 space-y-6">
          {/* theme toggle placeholder */}
          <div className="flex justify-end">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          {/* profile card */}
          <CardSkeleton className="h-24 w-full" />

          {/* search */}
          <Skeleton className="h-12 w-full rounded-full" />

          {/* trends */}
          <CardSkeleton className="h-56 w-full" />

          {/* who to follow */}
          <CardSkeleton className="h-64 w-full" />

          {/* recent activity */}
          <CardSkeleton className="h-56 w-full" />
        </aside>
      </div>
    </div>
  );
}

// export default LayoutLoader;
