import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import Composer from "../components/Composer.jsx";
import PostCard from "../components/PostCard.jsx";
import PendingPostCard from "../components/PendingPostCard.jsx";
import { usePosts } from "../api/posts.hooks.js";
import { usePendingPosts } from "../pendingPosts";
import { FeedSkeleton } from "../../../components/ui/Skeleton";

export default function Home() {
  const [active, setActive] = useState("For you");
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get("tag")?.toLowerCase() || "";
  const pendingPosts = usePendingPosts();

  const queryParams = useMemo(() => {
    // Clicking a hashtag shows every post with it, regardless of the tab
    if (tag) return { tag };
    switch (active) {
      case "Following":
        return { following: true };
      case "Art":
        return { isArt: true };
      case "Commissions":
        return { isArtist: true };
      default:
        return {};
    }
  }, [active, tag]);

  const { data, isLoading, isError } = usePosts(queryParams);

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-cg-bg/80 backdrop-blur-md transition-colors duration-200">
        {tag ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-cg-muted">Posts tagged</p>
              <h2 className="truncate text-lg font-semibold text-primary">#{tag}</h2>
            </div>
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="btn btn-ghost btn-sm rounded-full"
            >
              <FaTimes /> Clear
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 text-center font-semibold">
            {["For you", "Following", "Art", "Commissions"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`py-4 transition-colors duration-200 hover:bg-cg-hover ${
                  active === tab
                    ? "border-b-2 border-cg-primary text-cg-primary dark:border-cg-text dark:text-cg-text"
                    : "text-cg-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
        <div className="border-b border-cg-border" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {!tag && (
          <div className="border-b border-cg-border">
            <Composer />
          </div>
        )}

        {pendingPosts.map((item) => (
          <PendingPostCard key={item.id} item={item} />
        ))}

        {isLoading ? (
          <FeedSkeleton count={4} />
        ) : isError ? (
          <div className="p-6 text-center text-cg-muted">Could not load the feed. Please try again.</div>
        ) : tag && !data?.posts?.length ? (
          <div className="p-10 text-center text-sm text-cg-muted">No posts tagged #{tag} yet.</div>
        ) : (
          <div>
            {data?.posts?.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
