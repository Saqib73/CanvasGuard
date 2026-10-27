import { useMemo, useState } from "react";
import Composer from "../components/Composer.jsx";
import PostCard from "../components/PostCard.jsx";
import { usePosts } from "../api/posts.hooks.js";
import { FeedSkeleton } from "../../../components/ui/Skeleton";

export default function Home() {
  const [active, setActive] = useState("For you");

  const queryParams = useMemo(() => {
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
  }, [active]);

  const { data, isLoading, isError } = usePosts(queryParams);

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-cg-bg transition-colors duration-200">
        <div className="grid grid-cols-4 text-center bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold">
          {["For you", "Following", "Art", "Commissions"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`py-4 transition-colors duration-200 ${
                active === tab
                  ? "border-b-2 border-neutral-700 dark:border-neutral-300"
                  : "hover:bg-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="border-b border-neutral-300 dark:border-neutral-700" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="cg-card mx-4 mt-4">
          <Composer />
        </div>
        {isLoading ? (
          <FeedSkeleton count={4} />
        ) : isError ? (
          <div className="p-6 text-center text-neutral-500">Could not load the feed. Please try again.</div>
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
