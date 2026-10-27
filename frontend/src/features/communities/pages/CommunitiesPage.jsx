import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useCommunities,
  useCommunityFeed,
  useJoinCommunity,
  useLeaveCommunity,
  useMyCommunities,
} from "../api/communities.hooks";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import CommunityPostCard from "../components/CommunityPostCard";
import { CommunityFeedSkeleton, CommunityStripSkeleton } from "../../../components/ui/Skeleton";
import OptimizedImage from "../../../components/ui/OptimizedImage";

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState("home"); // "home" | "explore"
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: myData, isLoading: myLoading } = useMyCommunities();
  const { data: allData, isLoading: allLoading } = useCommunities();
  const { data: homeData, isLoading: homeLoading } = useCommunityFeed("home");
  const { data: exploreData, isLoading: exploreLoading } = useCommunityFeed("explore");
  const {
    mutateAsync: joinCommunity,
    isPending: isJoiningAny,
    variables: joiningId,
  } = useJoinCommunity();
  const {
    mutateAsync: leaveCommunity,
    isPending: isLeavingAny,
    variables: leavingId,
  } = useLeaveCommunity();

  // Mutation state is shared, so scope "Joining..." / "Leaving..." to the clicked card
  const isJoining = (id) => isJoiningAny && joiningId === id;
  const isLeaving = (id) => isLeavingAny && leavingId === id;

  const myCommunities = myData?.communities || [];
  const allCommunities = allData?.communities || [];
  const homeFeed = homeData?.posts || [];
  const exploreFeed = exploreData?.posts || [];
  const loading = myLoading || allLoading || homeLoading || exploreLoading;

  const displayedFeed = activeTab === "home" ? homeFeed : exploreFeed;
  const stripCommunities = activeTab === "home" ? myCommunities : allCommunities;

  const isCommunityMember = (community) => {
    if (!user?._id) return false;
    return (community.members || []).some((m) => {
      if (typeof m === "string") return m === user._id;
      return m?._id === user._id;
    });
  };

  const isCommunityCreator = (community) => {
    if (!user?._id) return false;
    const c = community.createdBy;
    if (!c) return false;
    if (typeof c === "string") return c === user._id;
    return c._id === user._id;
  };

  const handleJoin = async (id) => {
    try {
      await joinCommunity(id);
      toast.success("Joined community");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not join community");
    }
  };

  const handleLeave = async (id) => {
    try {
      await leaveCommunity(id);
      toast.success("Left community");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not leave community");
    }
  };

  const handleCommunityClick = (communityId) => {
    console.log("Go to community", communityId);
  };

  const handleCreateCommunity = () => {
    navigate("/createCommunity");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Nav */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-100/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-1 rounded-full hover:bg-base-200"
            aria-label="Back"
          >
            <span className="inline-block rotate-180 text-xl">➜</span>
          </button>
          <h1 className="text-xl font-semibold">Communities</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateCommunity}
            className="p-2 rounded-full hover:bg-base-200"
            aria-label="Create community"
          >
            👥
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-base-300">
        {["home", "explore"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-3 text-center text-sm font-medium"
          >
            <span
              className={activeTab === tab ? "font-semibold" : "opacity-60"}
            >
              {tab === "home" ? "Home" : "Explore"}
            </span>
            {activeTab === tab && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-0.5 w-10 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Communities strip */}
      <div className="border-b border-base-300">
        <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
          {myLoading || allLoading ? (
            <CommunityStripSkeleton />
          ) : stripCommunities.length === 0 ? (
            <div className="text-sm opacity-60">
              {activeTab === "home"
                ? "Join a community to see it here."
                : "No communities yet."}
            </div>
          ) : (
            stripCommunities.map((c) => {
              const member = isCommunityMember(c);
              const creator = isCommunityCreator(c);
              return (
                <div
                  key={c._id}
                  className="min-w-[170px] max-w-[200px] bg-base-200 rounded-2xl overflow-hidden border border-base-300 flex-shrink-0"
                >
                  <button
                    onClick={() => handleCommunityClick(c._id)}
                    className="block w-full text-left"
                  >
                    <OptimizedImage
                      src={c.coverArt?.url}
                      width={c.coverArt?.width}
                      height={c.coverArt?.height}
                      blurDataUrl={c.coverArt?.blurDataUrl}
                      alt={c.name}
                      sizes="200px"
                      wrapperClassName="h-24 w-full"
                      className="w-full h-full object-cover"
                    />
                    <div className="p-3 space-y-1">
                      <div className="text-sm font-semibold truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] opacity-60">
                        {(c.members || []).length} members
                      </div>
                    </div>
                  </button>
                  <div className="px-3 pb-3">
                    {creator ? (
                      <span className="inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full bg-base-300 opacity-80">
                        Creator
                      </span>
                    ) : member ? (
                      <button
                        onClick={() => handleLeave(c._id)}
                        disabled={isLeaving(c._id)}
                        className="inline-flex items-center justify-center text-xs px-3 py-1 rounded-full bg-base-300 hover:bg-base-200"
                      >
                        {isLeaving(c._id) ? "Leaving..." : "Joined"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(c._id)}
                        disabled={isJoining(c._id)}
                        className="inline-flex items-center justify-center text-xs px-3 py-1 rounded-full btn-primary"
                      >
                        {isJoining(c._id) ? "Joining..." : "Join"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <CommunityFeedSkeleton />
        ) : displayedFeed.length === 0 ? (
          <div className="flex justify-center py-10 opacity-60">
            No posts yet.
          </div>
        ) : (
          displayedFeed.map((post) => (
            <CommunityPostCard
              key={post._id}
              post={post}
              onCommunityClick={handleCommunityClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
