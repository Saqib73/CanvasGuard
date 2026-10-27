import { CardSkeleton, FeedSkeleton, Skeleton, SkeletonCircle, SkeletonGroup } from "./Skeleton";

export { Skeleton, CardSkeleton };

// Feed area only, used inside the app layout's <main> column
export const MainFeedCommonLoader = () => <FeedSkeleton count={4} />;

// Full app shell, mirrors components/layout/AppLayout.jsx while auth resolves
export const PageLoader = () => {
  return (
    <SkeletonGroup
      label="Loading CanvasGuard"
      className="min-h-screen relative overflow-hidden bg-base-100 text-base-content"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-yellow-500/5" />
      <div className="mx-auto max-w-7xl grid grid-cols-12 relative h-screen">
        <aside className="col-span-2 border-r border-base-300 p-4 space-y-6">
          <Skeleton className="h-6 w-32 mx-auto" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 h-12">
                <Skeleton className="h-5 w-5 flex-shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
          <div className="px-4 pt-8 flex flex-col gap-6">
            <Skeleton rounded="rounded-2xl" className="h-12 w-full" />
            <Skeleton rounded="rounded-2xl" className="h-12 w-full" />
          </div>
        </aside>

        <main className="col-span-7 border-r border-base-300 h-screen overflow-hidden">
          <div className="grid grid-cols-4 py-4 border-b border-base-300">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-16 mx-auto" />
            ))}
          </div>
          <div className="mx-4 mt-4">
            <CardSkeleton className="h-28 w-full" />
          </div>
          <FeedSkeleton count={3} />
        </main>

        <aside className="col-span-3 p-4 space-y-6 overflow-hidden">
          <div className="flex justify-end">
            <Skeleton rounded="rounded-full" className="h-8 w-14" />
          </div>
          <div className="cg-card p-5 flex items-center gap-4">
            <SkeletonCircle className="h-14 w-14" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton rounded="rounded-full" className="h-12 w-full" />
          <div className="cg-card p-5 space-y-5">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </SkeletonGroup>
  );
};

export default PageLoader;
