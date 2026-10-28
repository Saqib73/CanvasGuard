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
    <div className="flex items-center gap-4 border-b border-cg-border px-4 py-3">
      <SkeletonCircle className="h-8 w-8" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
    <Skeleton rounded="rounded-none" className="w-full h-40" />
    <div className="px-4 -mt-12 flex items-end gap-4">
      <SkeletonCircle className="relative h-24 w-24 ring-4 ring-cg-bg" />
      <div className="flex-1" />
      <Skeleton rounded="rounded-full" className="h-9 w-28" />
    </div>
    <div className="px-4 mt-4 space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3.5 w-24" />
    </div>
    <SkeletonText lines={2} className="px-4 mt-4" lastLineWidth="45%" />
    <div className="px-4 mt-4">
      <Skeleton className="h-3.5 w-36" />
    </div>
    <div className="px-4 mt-4 flex gap-6">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-20" />
    </div>
    <div className="mt-4 border-b border-cg-border grid grid-cols-3 py-3">
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
  <div className="w-[180px] rounded-2xl overflow-hidden border border-cg-border flex-shrink-0">
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

// Cover, name, description, stats and the join button of a community page
export const CommunityHeaderSkeleton = () => (
  <SkeletonGroup label="Loading community">
    <Skeleton rounded="rounded-none" className="h-44 w-full" />
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton rounded="rounded-full" className="h-9 w-24" />
      </div>
      <SkeletonText lines={2} lastLineWidth="60%" />
      <Skeleton className="h-3.5 w-32" />
    </div>
  </SkeletonGroup>
);

export const CommunityPostSkeleton = ({ withMedia = true }) => (
  <div className="border-b border-cg-border px-4 py-3 flex gap-3">
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

// Matches ArtistCard: avatar + name + button, bio, details, style chips, 3 artworks
export const ArtistCardSkeleton = () => (
  <div className="flex gap-3 border-b border-cg-border px-4 py-4">
    <SkeletonCircle className="h-12 w-12" />
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton rounded="rounded-full" className="h-8 w-36" />
      </div>
      <SkeletonText lines={2} className="mt-3" lastLineWidth="65%" />
      <Skeleton className="mt-3 h-3.5 w-40" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton rounded="rounded-full" className="h-5 w-16" />
        <Skeleton rounded="rounded-full" className="h-5 w-20" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} rounded="rounded-lg" className="aspect-square w-full" />
        ))}
      </div>
    </div>
  </div>
);

export const ArtistGridSkeleton = ({ count = 3 }) => (
  <SkeletonGroup label="Loading artists">
    {Array.from({ length: count }, (_, i) => (
      <ArtistCardSkeleton key={i} />
    ))}
  </SkeletonGroup>
);

// Matches CommissionRequestCard: person + status, description, details row, actions
export const CommissionRequestsSkeleton = ({ rows = 3 }) => (
  <SkeletonGroup label="Loading commission requests">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex gap-3 border-b border-cg-border px-4 py-4">
        <SkeletonCircle className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton rounded="rounded-full" className="h-5 w-16" />
          </div>
          <Skeleton className="mt-2 h-3 w-28" />
          <SkeletonText lines={2} className="mt-3" lastLineWidth="70%" />
          <div className="mt-3 flex gap-4">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          {i === 0 && (
            <div className="mt-4 flex gap-2">
              <Skeleton rounded="rounded-full" className="h-8 w-20" />
              <Skeleton rounded="rounded-full" className="h-8 w-20" />
            </div>
          )}
        </div>
      </div>
    ))}
  </SkeletonGroup>
);
