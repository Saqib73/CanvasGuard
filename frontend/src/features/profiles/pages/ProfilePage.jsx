import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { LuBrush, LuCalendarDays, LuClock } from "react-icons/lu";
import PostCard from "../../posts/components/PostCard.jsx";
import {
  useFollowUser,
  useUnfollowUser,
  useUserProfile,
} from "../api/profiles.hooks.js";
import { useLikedPosts } from "../../posts/api/posts.hooks.js";
import { useCurrentUser } from "../../auth/api/auth.hooks.js";
import { FeedSkeleton, ProfileSkeleton } from "../../../components/ui/Skeleton";
import OptimizedImage from "../../../components/ui/OptimizedImage";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { getAvatarUrl } from "../../../lib/avatar";
import { getErrorMessage } from "../../../lib/api-client";

const formatJoined = (date) =>
  date ? new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

const formatCount = (n) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);

function EmptyState({ title, body }) {
  return (
    <div className="px-8 py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-cg-muted">{body}</p>
    </div>
  );
}

// Styles, price and a request button for artists; only what the artist set up
function ArtistSection({ artist, isOwnProfile }) {
  const open = artist.openForCommission;
  return (
    <div className="mx-4 mt-4 rounded-2xl border border-cg-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <LuBrush className="text-cg-primary" aria-hidden="true" />
          Artist
          <span
            className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              open ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-cg-hover text-cg-muted"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-cg-muted"}`} />
            {open ? "Open for commissions" : "Commissions closed"}
          </span>
        </div>
        {open && !isOwnProfile && (
          <Link
            to={`/commissions/${artist._id}`}
            className="btn btn-sm rounded-full border-0 bg-cg-primary px-4 text-white hover:bg-cg-primary/90 dark:text-[#082f49]"
          >
            Request commission
          </Link>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-cg-muted">
        {artist.baseFee > 0 && (
          <span>
            From <span className="font-semibold text-cg-text">₹{artist.baseFee.toLocaleString("en-IN")}</span>
          </span>
        )}
        {artist.deliveryTime && (
          <span className="inline-flex items-center gap-1">
            <LuClock aria-hidden="true" /> {artist.deliveryTime}
          </span>
        )}
      </div>

      {artist.artStyles?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {artist.artStyles.map((style) => (
            <span key={style} className="rounded-full border border-cg-border px-2.5 py-0.5 text-xs text-cg-text">
              {style}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const TAB_ACTIVE =
  "border-b-2 border-cg-primary text-cg-primary font-semibold dark:border-cg-text dark:text-cg-text";

export default function Profile() {
  const { userName } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading: profileIsLoading, isError: profileIsError } = useUserProfile(userName);
  const { data: authUser } = useCurrentUser();
  const isOwnProfile = authUser?.userName === userName;
  const [mode, setMode] = useState("posts");
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  // Likes are private, like on X: only fetched and shown on your own profile
  const { data: likedData, isLoading: likedPostsIsLoading } = useLikedPosts({ enabled: isOwnProfile });
  const { mutateAsync: followUser, isPending: isFollowingPending } = useFollowUser();
  const { mutateAsync: unfollowUser, isPending: isUnfollowingPending } = useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(false);

  const profile = user?.user;

  useEffect(() => {
    if (profile && authUser) {
      setIsFollowing(profile.followers.some((f) => f._id === authUser._id));
    }
  }, [profile, authUser]);

  // Switching between profiles starts on the Posts tab again
  useEffect(() => setMode("posts"), [userName]);

  const handleFollow = async () => {
    try {
      await followUser(profile._id);
      setIsFollowing(true);
      toast.success(`You're following @${profile.userName}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(profile._id);
      setIsFollowing(false);
      setConfirmUnfollow(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (profileIsLoading) return <ProfileSkeleton />;
  if (profileIsError || !profile)
    return <div className="p-6 text-center text-cg-muted">This profile could not be loaded.</div>;

  const posts = profile.posts || [];
  const mediaPosts = posts.filter((p) => p.media?.url);
  const likedPosts = likedData?.allLikedPosts?.likedPosts || [];
  const tabs = [
    ["posts", "Posts"],
    ["media", "Media"],
    ...(isOwnProfile ? [["likes", "Likes"]] : []),
  ];
  const followBusy = isFollowingPending || isUnfollowingPending;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-cg-border bg-cg-bg/80 px-4 py-2 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight">{profile.name}</h1>
          <p className="text-xs text-cg-muted">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>

      {/* Cover: the auth pages' blue in light mode, a subtle dark version in dark mode */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-sky-600 via-sky-800 to-slate-950 dark:from-sky-950 dark:via-zinc-950 dark:to-black">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(-30deg, #fff 0 1px, transparent 1px 28px)" }}
        />
      </div>

      {/* Avatar + action */}
      <div className="flex items-end gap-4 px-4 -mt-12">
        <img
          src={getAvatarUrl(profile)}
          alt=""
          className="relative h-24 w-24 rounded-full object-cover ring-4 ring-cg-bg"
        />
        <div className="flex-1" />
        {isOwnProfile ? (
          <Link
            to="/edit-profile"
            className="btn btn-sm rounded-full border border-cg-border bg-transparent px-4 text-cg-text shadow-none hover:bg-cg-hover"
          >
            Edit profile
          </Link>
        ) : isFollowing ? (
          <button
            disabled={followBusy}
            onClick={() => setConfirmUnfollow(true)}
            className="group btn btn-sm min-w-28 rounded-full border border-cg-border bg-transparent px-4 text-cg-text shadow-none hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
          >
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline">Unfollow</span>
          </button>
        ) : (
          <button
            disabled={followBusy}
            onClick={handleFollow}
            className="btn btn-sm min-w-24 rounded-full border-0 bg-cg-primary px-4 text-white hover:bg-cg-primary/90 dark:text-[#082f49]"
          >
            {isFollowingPending ? "Following..." : "Follow"}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 px-4">
        <div className="flex items-center gap-2 text-xl font-bold">
          {profile.name}
          {profile.verified && <span className="text-sm text-cg-primary" title="Verified">✔</span>}
        </div>
        <div className="text-cg-muted">@{profile.userName}</div>
      </div>

      {profile.bio && <p className="mt-3 whitespace-pre-wrap px-4 text-[15px]">{profile.bio}</p>}

      <div className="mt-3 flex items-center gap-1.5 px-4 text-sm text-cg-muted">
        <LuCalendarDays aria-hidden="true" />
        Joined {formatJoined(profile.createdAt)}
      </div>

      <div className="mt-3 flex gap-5 px-4 text-sm">
        <span>
          <span className="font-semibold">{formatCount(profile.following.length)}</span>{" "}
          <span className="text-cg-muted">Following</span>
        </span>
        <span>
          <span className="font-semibold">{formatCount(profile.followers.length)}</span>{" "}
          <span className="text-cg-muted">{profile.followers.length === 1 ? "Follower" : "Followers"}</span>
        </span>
      </div>

      {profile.isArtist && profile.artistProfile?._id && (
        <ArtistSection artist={profile.artistProfile} isOwnProfile={isOwnProfile} />
      )}

      {/* Tabs */}
      <div
        className="mt-4 grid border-b border-cg-border text-center text-sm"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        role="tablist"
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={`py-3 transition-colors hover:bg-cg-hover ${mode === key ? TAB_ACTIVE : "text-cg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {mode === "posts" &&
        (posts.length ? (
          posts.map((p) => <PostCard key={p._id} post={p} />)
        ) : (
          <EmptyState
            title={isOwnProfile ? "You haven't posted yet" : `@${profile.userName} hasn't posted yet`}
            body={isOwnProfile ? "When you share something, it'll show up here." : "When they do, their posts will show up here."}
          />
        ))}

      {mode === "media" &&
        (mediaPosts.length ? (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {mediaPosts.map((p) => (
              <Link key={p._id} to={`/post/${p._id}`} className="block aspect-square overflow-hidden bg-cg-hover">
                <OptimizedImage
                  src={p.media.url}
                  width={p.media.width}
                  height={p.media.height}
                  blurDataUrl={p.media.blurDataUrl}
                  alt={p.description || "Post image"}
                  sizes="200px"
                  wrapperClassName="h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No images yet" body="Photos and artwork they post will show up here." />
        ))}

      {mode === "likes" &&
        (likedPostsIsLoading ? (
          <FeedSkeleton count={3} label="Loading liked posts" />
        ) : likedPosts.length ? (
          likedPosts.map((p) => <PostCard key={p._id} post={p} />)
        ) : (
          <EmptyState title="No likes yet" body="Posts you like will show up here. Only you can see this tab." />
        ))}

      {confirmUnfollow && (
        <ConfirmDialog
          title={`Unfollow @${profile.userName}?`}
          body="Their posts will no longer show up in your Following feed. You can still view their profile."
          confirmLabel="Unfollow"
          pendingLabel="Unfollowing..."
          pending={isUnfollowingPending}
          onCancel={() => setConfirmUnfollow(false)}
          onConfirm={handleUnfollow}
        />
      )}
    </div>
  );
}
