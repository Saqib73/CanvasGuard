import { useState } from "react";
// import { useStore } from "../store.jsx";
import Composer from "../components/Composer";
import Tweet from "../components/Tweet";
import { useGetPostsQuery } from "../redux/api/api.js";
import { useEffect } from "react";

export default function Home() {
  // const { posts } = useStore();
  const data = useGetPostsQuery();
  // const posts = data.data.posts;
  const [active, setActive] = useState("For you");
  console.log(data);
  useEffect(() => {
    console.log(data);
  }, [data]);

  return data.isLoading ? (
    <div>loading...</div>
  ) : (
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
        <div>
          {data.data.posts.map((p) => (
            <Tweet key={p.id} post={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
