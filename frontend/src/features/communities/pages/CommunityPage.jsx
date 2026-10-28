import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { LuCalendarDays, LuPenLine, LuScrollText, LuUsers } from "react-icons/lu";
import { useCommunity } from "../api/communities.hooks";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import PostCard from "../../posts/components/PostCard";
import MembershipButton from "../components/MembershipButton";
import { isMemberOf } from "../membership";
import OptimizedImage from "../../../components/ui/OptimizedImage";
import { CommunityFeedSkeleton, CommunityHeaderSkeleton } from "../../../components/ui/Skeleton";
import { getAvatarUrl } from "../../../lib/avatar";

const formatCount = (n) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);
const formatCreated = (date) =>
  date ? new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useCommunity(id);
  const community = data?.community;

  const header = (
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
        <h1 className="truncate text-lg font-bold leading-tight">{community?.name || "Community"}</h1>
        {community && (
          <p className="text-xs text-cg-muted">
            {community.posts.length} {community.posts.length === 1 ? "post" : "posts"}
          </p>
        )}
      </div>
    </div>
  );

  if (isLoading)
    return (
      <div className="h-full overflow-y-auto no-scrollbar">
        {header}
        <CommunityHeaderSkeleton />
        <CommunityFeedSkeleton count={2} />
      </div>
    );

  if (isError || !community)
    return (
      <div className="h-full overflow-y-auto no-scrollbar">
        {header}
        <div className="px-8 py-12 text-center">
          <p className="text-lg font-semibold">This community doesn't exist</p>
          <p className="mt-1 text-sm text-cg-muted">It may have been removed, or the link is wrong.</p>
          <Link to="/communities" className="btn btn-sm mt-4 rounded-full border border-cg-border bg-transparent px-5 text-cg-text shadow-none hover:bg-cg-hover">
            Back to communities
          </Link>
        </div>
      </div>
    );

  const members = community.members || [];
  const isMember = isMemberOf(community, user?._id);
  const creator = community.createdBy;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {header}

      <OptimizedImage
        src={community.coverArt?.url}
        width={community.coverArt?.width}
        height={community.coverArt?.height}
        blurDataUrl={community.coverArt?.blurDataUrl}
        alt=""
        sizes="(max-width: 640px) 100vw, 600px"
        priority
        wrapperClassName="h-44 w-full bg-cg-hover"
        className="h-full w-full object-cover"
      />

      <div className="border-b border-cg-border px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold leading-tight">{community.name}</h2>
          <div className="flex flex-shrink-0 items-center gap-2">
            {isMember && (
              <button
                type="button"
                onClick={() => navigate("/post", { state: { communityId: community._id } })}
                className="btn btn-sm rounded-full border-0 bg-cg-primary px-4 text-white hover:bg-cg-primary/90 dark:text-[#082f49]"
              >
                <LuPenLine aria-hidden="true" /> Post here
              </button>
            )}
            <MembershipButton community={community} />
          </div>
        </div>

        {community.description && (
          <p className="mt-2 whitespace-pre-wrap text-[15px]">{community.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-cg-muted">
          <span className="inline-flex items-center gap-2">
            {/* A few member avatars, like X communities */}
            <span className="flex -space-x-2">
              {members.slice(0, 5).map((m) => (
                <img
                  key={m._id}
                  src={getAvatarUrl(m)}
                  alt=""
                  title={`@${m.userName}`}
                  className="h-6 w-6 rounded-full object-cover ring-2 ring-cg-bg"
                />
              ))}
            </span>
            <span>
              <span className="font-semibold text-cg-text">{formatCount(members.length)}</span>{" "}
              {members.length === 1 ? "member" : "members"}
            </span>
          </span>
          {creator?.userName && (
            <span className="inline-flex items-center gap-1">
              <LuUsers aria-hidden="true" /> Created by{" "}
              <Link to={`/artist/${creator.userName}`} className="text-cg-text hover:underline">
                @{creator.userName}
              </Link>
            </span>
          )}
          {community.createdAt && (
            <span className="inline-flex items-center gap-1">
              <LuCalendarDays aria-hidden="true" /> Created {formatCreated(community.createdAt)}
            </span>
          )}
        </div>

        {community.rules && (
          <div className="mt-4 rounded-2xl border border-cg-border p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <LuScrollText className="text-cg-primary" aria-hidden="true" /> Rules
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-cg-muted">{community.rules}</p>
          </div>
        )}
      </div>

      {community.posts.length ? (
        community.posts.map((post) => <PostCard key={post._id} post={post} showCommunity={false} />)
      ) : (
        <div className="px-8 py-12 text-center">
          <p className="text-lg font-semibold">No posts yet</p>
          <p className="mt-1 text-sm text-cg-muted">
            {isMember ? "Be the first to post in this community." : "Join to be the first to post here."}
          </p>
        </div>
      )}
    </div>
  );
}
