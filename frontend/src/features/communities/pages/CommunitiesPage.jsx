import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { LuPlus } from "react-icons/lu";
import {
  useCommunities,
  useCommunityFeed,
  useMyCommunities,
} from "../api/communities.hooks";
import PostCard from "../../posts/components/PostCard";
import MembershipButton from "../components/MembershipButton";
import { CommunityFeedSkeleton, CommunityStripSkeleton } from "../../../components/ui/Skeleton";
import OptimizedImage from "../../../components/ui/OptimizedImage";

const TABS = [
  ["home", "Home"],
  ["explore", "Explore"],
];

const formatMembers = (n) =>
  `${new Intl.NumberFormat("en", { notation: "compact" }).format(n)} ${n === 1 ? "member" : "members"}`;

function CommunityCard({ community }) {
  return (
    <div className="flex w-[180px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-cg-border transition-colors hover:border-cg-primary/50">
      <Link to={`/communities/${community._id}`} className="block">
        <OptimizedImage
          src={community.coverArt?.url}
          width={community.coverArt?.width}
          height={community.coverArt?.height}
          blurDataUrl={community.coverArt?.blurDataUrl}
          alt=""
          sizes="200px"
          wrapperClassName="h-24 w-full bg-cg-hover"
          className="h-full w-full object-cover"
        />
        <div className="space-y-0.5 px-3 pt-3">
          <div className="truncate text-sm font-semibold">{community.name}</div>
          <div className="text-xs text-cg-muted">{formatMembers((community.members || []).length)}</div>
        </div>
      </Link>
      <div className="px-3 pb-3 pt-2">
        <MembershipButton community={community} size="btn-xs" />
      </div>
    </div>
  );
}

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();

  // Each tab only waits for its own data
  const mine = useMyCommunities();
  const all = useCommunities();
  const homeFeed = useCommunityFeed("home");
  const exploreFeed = useCommunityFeed("explore");

  const onHome = activeTab === "home";
  const strip = onHome ? mine : all;
  const feed = onHome ? homeFeed : exploreFeed;
  const stripCommunities = strip.data?.communities || [];
  const posts = feed.data?.posts || [];
  const hasJoinedAny = (mine.data?.communities || []).length > 0;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 bg-cg-bg/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-xl font-bold">Communities</h1>
          </div>
          <Link
            to="/createCommunity"
            className="btn btn-sm rounded-full border border-cg-border bg-transparent px-4 text-cg-text shadow-none hover:bg-cg-hover"
          >
            <LuPlus aria-hidden="true" /> Create
          </Link>
        </div>

        <div className="grid grid-cols-2 border-b border-cg-border text-center font-semibold" role="tablist">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`py-3 transition-colors hover:bg-cg-hover ${
                activeTab === key
                  ? "border-b-2 border-cg-primary text-cg-primary dark:border-cg-text dark:text-cg-text"
                  : "text-cg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Communities strip */}
      <div className="border-b border-cg-border">
        <div className="flex gap-3 overflow-x-auto px-4 py-3 no-scrollbar">
          {strip.isLoading ? (
            <CommunityStripSkeleton />
          ) : stripCommunities.length === 0 ? (
            <p className="py-2 text-sm text-cg-muted">
              {onHome ? "Communities you join will show up here." : "No communities yet. Create the first one!"}
            </p>
          ) : (
            stripCommunities.map((c) => <CommunityCard key={c._id} community={c} />)
          )}
        </div>
      </div>

      {/* Feed */}
      {feed.isLoading ? (
        <CommunityFeedSkeleton />
      ) : feed.isError ? (
        <p className="p-6 text-center text-cg-muted">Could not load posts. Please try again.</p>
      ) : posts.length ? (
        posts.map((post) => <PostCard key={post._id} post={post} />)
      ) : onHome && !hasJoinedAny ? (
        <div className="px-8 py-12 text-center">
          <p className="text-lg font-semibold">Find your people</p>
          <p className="mt-1 text-sm text-cg-muted">
            Join communities to see their posts here.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("explore")}
            className="btn btn-sm mt-4 rounded-full border-0 bg-cg-primary px-5 text-white hover:bg-cg-primary/90 dark:text-[#082f49]"
          >
            Explore communities
          </button>
        </div>
      ) : (
        <div className="px-8 py-12 text-center">
          <p className="text-lg font-semibold">No posts yet</p>
          <p className="mt-1 text-sm text-cg-muted">
            {onHome ? "Posts in your communities will show up here." : "Community posts will show up here."}
          </p>
        </div>
      )}
    </div>
  );
}
