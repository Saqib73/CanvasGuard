import { useMemo, useState } from "react";
import { useStore } from "../../../app/store/store";
import PostCard from "../../posts/components/PostCard";

export default function ExplorePage() {
  const { posts } = useStore();
  const [filterNoAI, setFilterNoAI] = useState(false);
  const [filterWatermarked, setFilterWatermarked] = useState(false);

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        if (filterNoAI && !p.license?.includes("no_ai")) return false;
        if (filterWatermarked && !p.watermarked) return false;
        return true;
      }),
    [posts, filterNoAI, filterWatermarked]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 backdrop-blur bg-base-100/80 border-b border-base-300 p-4 font-semibold text-lg">
        Explore
      </div>
      <div className="p-4 flex gap-4 text-sm border-b border-base-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={filterNoAI}
            onChange={(e) => setFilterNoAI(e.target.checked)}
          />
          <span>Only Non-AI</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={filterWatermarked}
            onChange={(e) => setFilterWatermarked(e.target.checked)}
          />
          <span>Watermarked Only</span>
        </label>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filtered.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}

export const Explore = ExplorePage;
