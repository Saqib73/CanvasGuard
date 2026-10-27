// Shimmer skeletons. Each composite mirrors the layout of the real component it stands in for,
// so content swaps in without the page jumping. Colors live in theme/tokens.css (--cg-skeleton*).

export const Skeleton = ({ className = "", rounded = "rounded-md", style }) => (
  <div aria-hidden="true" className={`cg-skeleton ${rounded} ${className}`} style={style} />
);

export const SkeletonCircle = ({ className = "h-10 w-10" }) => (
  <Skeleton rounded="rounded-full" className={`flex-shrink-0 ${className}`} />
);

export const SkeletonText = ({ lines = 2, className = "", lastLineWidth = "60%" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        className="h-3"
        style={{ width: i === lines - 1 && lines > 1 ? lastLineWidth : "100%" }}
      />
    ))}
  </div>
);

/** Announces loading to screen readers; the skeleton shapes themselves are aria-hidden. */
export const SkeletonGroup = ({ label = "Loading", className = "", children }) => (
  <div role="status" aria-busy="true" aria-live="polite" className={className}>
    <span className="sr-only">{label}…</span>
    {children}
  </div>
);

// Generic rounded card block, kept for existing imports
export const CardSkeleton = ({ className = "" }) => (
  <Skeleton rounded="rounded-2xl" className={className} />
);

/* ---------- Posts ---------- */

export const PostCardSkeleton = ({ withMedia = true }) => (
  <div className="flex gap-3 p-4 border-b border-neutral-300 dark:border-neutral-800">
    <SkeletonCircle className="h-10 w-10" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <SkeletonText lines={2} className="mt-3" lastLineWidth="70%" />
      {withMedia && <Skeleton rounded="rounded-2xl" className="mt-3 h-64 w-full" />}
      <div className="flex justify-between mt-4 max-w-md">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-3.5 w-12" />
        ))}
      </div>
    </div>
  </div>
);

export const FeedSkeleton = ({ count = 4, label = "Loading posts" }) => (
  <SkeletonGroup label={label}>
    {Array.from({ length: count }, (_, i) => (
      <PostCardSkeleton key={i} withMedia={i % 2 === 0} />
    ))}
  </SkeletonGroup>
);

export const CommentSkeleton = () => (
  <div className="flex gap-3 p-4 border-b border-neutral-300 dark:border-neutral-800">
    <SkeletonCircle className="h-9 w-9" />
    <div className="flex-1">
      <Skeleton className="h-3.5 w-32" />
      <SkeletonText lines={2} className="mt-3" />
    </div>
  </div>
);

export const PostDetailSkeleton = () => (
  <SkeletonGroup label="Loading post" className="h-full overflow-hidden">
    <div className="border-b border-neutral-300 dark:border-neutral-800 p-3">
      <Skeleton className="h-4 w-12" />
    </div>
    <PostCardSkeleton withMedia />
    <div className="p-4">
      <div className="cg-card p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton rounded="rounded-xl" className="h-20 w-full" />
        <div className="flex justify-end">
          <Skeleton rounded="rounded-full" className="h-9 w-20" />
        </div>
      </div>
    </div>
    {Array.from({ length: 3 }, (_, i) => (
      <CommentSkeleton key={i} />
    ))}
  </SkeletonGroup>
);

/* ---------- Profile ---------- */

export const ProfileSkeleton = () => (
  <SkeletonGroup label="Loading profile" className="h-full overflow-hidden">
    <Skeleton rounded="rounded-none" className="w-full h-40" />
    <div className="px-4 -mt-10 flex items-end gap-4">
      <SkeletonCircle className="h-24 w-24 ring-4 ring-base-100" />
      <div className="flex-1" />
      <Skeleton rounded="rounded-full" className="h-9 w-28" />
    </div>
    <div className="px-4 mt-4 space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3.5 w-24" />
    </div>
    <SkeletonText lines={2} className="px-4 mt-4" lastLineWidth="45%" />
    <div className="px-4 mt-4 flex gap-4">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-3.5 w-20" />
    </div>
    <div className="px-4 mt-4 flex gap-6">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-20" />
    </div>
    <div className="mt-4 border-b border-neutral-300 dark:border-neutral-800 grid grid-cols-3 py-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-3.5 w-14 mx-auto" />
      ))}
    </div>
    <PostCardSkeleton withMedia />
    <PostCardSkeleton withMedia={false} />
  </SkeletonGroup>
);

/* ---------- Notifications ---------- */

export const NotificationListSkeleton = ({ count = 5 }) => (
  <SkeletonGroup label="Loading notifications" className="space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="cg-card p-5 border border-base-300 space-y-3">
        <Skeleton className="h-4" style={{ width: `${85 - (i % 3) * 15}%` }} />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </SkeletonGroup>
);

/* ---------- Communities ---------- */

export const CommunityCardSkeleton = () => (
  <div className="min-w-[170px] max-w-[200px] bg-base-200 rounded-2xl overflow-hidden border border-base-300 flex-shrink-0">
    <Skeleton rounded="rounded-none" className="h-24 w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-3 w-16" />
      <Skeleton rounded="rounded-full" className="h-7 w-full mt-3" />
    </div>
  </div>
);

export const CommunityStripSkeleton = ({ count = 4 }) => (
  <SkeletonGroup label="Loading communities" className="flex gap-3">
    {Array.from({ length: count }, (_, i) => (
      <CommunityCardSkeleton key={i} />
    ))}
  </SkeletonGroup>
);

export const CommunityPostSkeleton = ({ withMedia = true }) => (
  <div className="border-b border-base-300 px-4 py-3 flex gap-3">
    <SkeletonCircle className="h-10 w-10" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton rounded="rounded-full" className="h-5 w-24 mt-2" />
      <SkeletonText lines={2} className="mt-3" />
      {withMedia && <Skeleton rounded="rounded-2xl" className="mt-3 h-60 w-full" />}
    </div>
  </div>
);

export const CommunityFeedSkeleton = ({ count = 3 }) => (
  <SkeletonGroup label="Loading community posts">
    {Array.from({ length: count }, (_, i) => (
      <CommunityPostSkeleton key={i} withMedia={i % 2 === 0} />
    ))}
  </SkeletonGroup>
);

/* ---------- Commissions ---------- */

export const ArtistCardSkeleton = () => (
  <div className="cg-card p-5 flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle className="w-14 h-14" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3.5 w-1/2 mt-2" />
      <Skeleton className="h-3 w-36 mt-2" />
    </div>
    <div className="mt-4 pt-3 border-t border-base-300">
      <Skeleton rounded="rounded-full" className="h-8 w-full" />
    </div>
  </div>
);

export const ArtistGridSkeleton = ({ count = 6 }) => (
  <SkeletonGroup label="Loading artists" className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <ArtistCardSkeleton key={i} />
    ))}
  </SkeletonGroup>
);

export const CommissionRequestsSkeleton = ({ rows = 5 }) => (
  <SkeletonGroup
    label="Loading commission requests"
    className="overflow-hidden rounded-2xl shadow-lg border border-base-300 bg-base-200"
  >
    <div className="grid grid-cols-[2fr_1fr_2fr_1.5fr] gap-4 bg-base-300 py-3 px-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-3 w-16" />
      ))}
    </div>
    <div className="divide-y divide-base-300">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-[2fr_1fr_2fr_1.5fr] gap-4 items-center py-3 px-4">
          <div className="flex items-center gap-3">
            <SkeletonCircle className="w-10 h-10" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-full" />
          <div className="flex gap-2">
            <Skeleton rounded="rounded-full" className="h-8 w-16" />
            <Skeleton rounded="rounded-full" className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  </SkeletonGroup>
);
