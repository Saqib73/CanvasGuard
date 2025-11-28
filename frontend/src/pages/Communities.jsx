// import { useState, useEffect } from "react";
// import axios from "axios";

// export default function Communities() {
//   const [myCommunities, setMyCommunities] = useState([]);
//   const [exploreCommunities, setExploreCommunities] = useState([]);
//   const [activeCommunity, setActiveCommunity] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [postText, setPostText] = useState("");
//   const [mediaFile, setMediaFile] = useState(null);

//   // Fetch communities user belongs to
//   const loadMyCommunities = async () => {
//     const { data } = await axios.get(
//       `${import.meta.env.VITE_SERVER}/api/v1/community/my`,
//       { withCredentials: true }
//     );
//     setMyCommunities(data.communities);
//   };

//   // Fetch all communities (for explore section)
//   const loadExploreCommunities = async () => {
//     const { data } = await axios.get(
//       `${import.meta.env.VITE_SERVER}/api/v1/community/all`,
//       { withCredentials: true }
//     );
//     setExploreCommunities(data.communities);
//   };

//   // Fetch detailed community (posts included)
//   const loadCommunity = async (id) => {
//     const { data } = await axios.get(
//       `${import.meta.env.VITE_SERVER}/api/v1/community/${id}`,
//       { withCredentials: true }
//     );
//     setActiveCommunity(data.community);
//   };

//   useEffect(() => {
//     (async () => {
//       await loadMyCommunities();
//       await loadExploreCommunities();
//       setLoading(false);
//     })();
//   }, []);

//   // Join community
//   const handleJoin = async (id) => {
//     await axios.post(
//       `${import.meta.env.VITE_SERVER}/api/v1/community/join/${id}`,
//       {},
//       { withCredentials: true }
//     );

//     await loadMyCommunities();
//     await loadExploreCommunities();
//   };

//   // Leave community
//   const handleLeave = async (id) => {
//     await axios.post(
//       `${import.meta.env.VITE_SERVER}/api/v1/community/leave/${id}`,
//       {},
//       { withCredentials: true }
//     );

//     setActiveCommunity(null);
//     await loadMyCommunities();
//     await loadExploreCommunities();
//   };

//   // Create post inside community
//   const submitPost = async () => {
//     if (!postText.trim() && !mediaFile) return;

//     const formData = new FormData();
//     formData.append("communityId", activeCommunity._id);
//     formData.append("description", postText);
//     if (mediaFile) formData.append("media", mediaFile);

//     await axios.post(
//       `${import.meta.env.VITE_SERVER}/api/v1/posts/create`,
//       formData,
//       {
//         withCredentials: true,
//         headers: { "Content-Type": "multipart/form-data" },
//       }
//     );

//     setPostText("");
//     setMediaFile(null);

//     // Reload community with updated posts
//     await loadCommunity(activeCommunity._id);
//   };

//   if (loading)
//     return <div className="w-full flex justify-center mt-20">Loading...</div>;

//   return (
//     <div className="h-full grid grid-cols-3 gap-4 p-4">
//       {/* LEFT: Community List */}
//       <div className="col-span-1 space-y-6">
//         {/* My Communities */}
//         <div>
//           <h2 className="text-lg font-semibold mb-2">My Communities</h2>
//           <div className="space-y-2">
//             {myCommunities.map((c) => (
//               <button
//                 key={c._id}
//                 onClick={() => loadCommunity(c._id)}
//                 className="w-full text-left px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl"
//               >
//                 <div className="font-semibold">{c.name}</div>
//                 <div className="text-xs text-neutral-400">{c.description}</div>
//               </button>
//             ))}
//             {myCommunities.length === 0 && (
//               <div className="text-neutral-500 text-sm">
//                 You have not joined any communities yet.
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Explore Communities */}
//         <div>
//           <h2 className="text-lg font-semibold mb-2">Explore</h2>
//           <div className="space-y-2">
//             {exploreCommunities.map((c) => {
//               const isMember = c.members.includes(import.meta.env.VITE_USER_ID);
//               return (
//                 <div
//                   key={c._id}
//                   className="flex items-center justify-between px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl"
//                 >
//                   <div className="font-medium">{c.name}</div>
//                   {!isMember ? (
//                     <button
//                       onClick={() => handleJoin(c._id)}
//                       className="px-3 py-1 bg-sky-500 hover:bg-sky-600 rounded"
//                     >
//                       Join
//                     </button>
//                   ) : (
//                     <button
//                       onClick={() => loadCommunity(c._id)}
//                       className="px-3 py-1 bg-neutral-700 rounded"
//                     >
//                       View
//                     </button>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* RIGHT: Community Feed */}
//       <div className="col-span-2">
//         {!activeCommunity ? (
//           <div className="text-neutral-500 text-center mt-20">
//             Select a community to view posts
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-3">
//               <h1 className="text-2xl font-bold">{activeCommunity.name}</h1>

//               <button
//                 onClick={() => handleLeave(activeCommunity._id)}
//                 className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
//               >
//                 Leave
//               </button>
//             </div>

//             {/* Create Post */}
//             <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-700">
//               <textarea
//                 value={postText}
//                 onChange={(e) => setPostText(e.target.value)}
//                 className="w-full bg-transparent outline-none resize-none"
//                 placeholder="Share something with the community..."
//               />

//               <input
//                 type="file"
//                 onChange={(e) => setMediaFile(e.target.files[0])}
//                 className="mt-2"
//               />

//               <button
//                 onClick={submitPost}
//                 className="mt-3 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg"
//               >
//                 Post
//               </button>
//             </div>

//             {/* Posts */}
//             <div className="space-y-4">
//               {activeCommunity.posts.map((p) => (
//                 <div
//                   key={p._id}
//                   className="p-4 bg-neutral-900 rounded-xl border border-neutral-700"
//                 >
//                   <div className="flex items-center gap-3 mb-3">
//                     <img
//                       src={p.author.profilePic?.url}
//                       className="h-10 w-10 rounded-full"
//                     />
//                     <div>
//                       <div className="font-semibold">{p.author.name}</div>
//                       <div className="text-sm text-neutral-400">
//                         @{p.author.userName}
//                       </div>
//                     </div>
//                   </div>

//                   {p.media?.url && (
//                     <img src={p.media.url} className="w-full rounded-xl mb-3" />
//                   )}

//                   {p.description && (
//                     <div className="text-neutral-300">{p.description}</div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState("home"); // "home" | "explore"
  const [myCommunities, setMyCommunities] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [homeFeed, setHomeFeed] = useState([]);
  const [exploreFeed, setExploreFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);

  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const loadData = async () => {
    try {
      setLoading(true);
      const base = import.meta.env.VITE_SERVER;

      const [myRes, allRes, homeRes, exploreRes] = await Promise.all([
        axios.get(`${base}/api/v1/community/my`, { withCredentials: true }),
        axios.get(`${base}/api/v1/community/all`, { withCredentials: true }),
        axios.get(`${base}/api/v1/community/feed/home`, {
          withCredentials: true,
        }),
        axios.get(`${base}/api/v1/community/feed/explore`, {
          withCredentials: true,
        }),
      ]);

      setMyCommunities(myRes.data.communities || []);
      setAllCommunities(allRes.data.communities || []);
      setHomeFeed(homeRes.data.posts || []);
      setExploreFeed(exploreRes.data.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayedFeed = activeTab === "home" ? homeFeed : exploreFeed;

  const stripCommunities = useMemo(() => {
    if (activeTab === "home") return myCommunities;
    // For explore, show some/all communities as suggestions
    return allCommunities;
  }, [activeTab, myCommunities, allCommunities]);

  const isCommunityMember = (community) => {
    if (!user._id) return false;
    return (community.members || []).some((m) => {
      // m can be ObjectId string or populated user
      if (typeof m === "string") return m === user._id;
      return m?._id === user._id;
    });
  };

  const isCommunityCreator = (community) => {
    if (!user._id) return false;
    const c = community.createdBy;
    if (!c) return false;
    if (typeof c === "string") return c === user._id;
    return c._id === user._id;
  };

  const handleJoin = async (id) => {
    try {
      setJoining(id);
      const base = import.meta.env.VITE_SERVER;
      await axios.post(
        `${base}/api/v1/community/join/${id}`,
        {},
        { withCredentials: true }
      );
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = async (id) => {
    try {
      setJoining(id);
      const base = import.meta.env.VITE_SERVER;
      await axios.post(
        `${base}/api/v1/community/leave/${id}`,
        {},
        { withCredentials: true }
      );
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(null);
    }
  };

  const handleCommunityClick = (communityId) => {
    // You can integrate React Router here:
    // navigate(`/communities/${communityId}`)
    console.log("Go to community", communityId);
  };

  const handleCreateCommunity = () => {
    navigate("/createCommunity");
  };

  return (
    <div className="h-full flex flex-col text-white">
      {/* Top Nav */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-1 rounded-full hover:bg-neutral-800"
            aria-label="Back"
          >
            <span className="inline-block rotate-180 text-xl">➜</span>
          </button>
          <h1 className="text-xl font-semibold">Communities</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full hover:bg-neutral-800"
            aria-label="Search"
          >
            🔍
          </button>
          <button
            onClick={handleCreateCommunity}
            className="p-2 rounded-full hover:bg-neutral-800"
            aria-label="Create community"
          >
            👥
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-neutral-800">
        {["home", "explore"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-3 text-center text-sm font-medium"
          >
            <span
              className={activeTab === tab ? "text-white" : "text-neutral-400"}
            >
              {tab === "home" ? "Home" : "Explore"}
            </span>
            {activeTab === tab && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-0.5 w-10 bg-sky-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Communities strip */}
      <div className="border-b border-neutral-800">
        <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
          {stripCommunities.length === 0 ? (
            <div className="text-sm text-neutral-500">
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
                  className="min-w-[170px] max-w-[200px] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 flex-shrink-0"
                >
                  <button
                    onClick={() => handleCommunityClick(c._id)}
                    className="block w-full text-left"
                  >
                    <div className="h-24 w-full overflow-hidden">
                      <img
                        src={c.coverArt?.url}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="text-sm font-semibold truncate">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {(c.members || []).length} members
                      </div>
                    </div>
                  </button>
                  <div className="px-3 pb-3">
                    {creator ? (
                      <span className="inline-flex items-center justify-center text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                        Creator
                      </span>
                    ) : member ? (
                      <button
                        onClick={() => handleLeave(c._id)}
                        disabled={joining === c._id}
                        className="inline-flex items-center justify-center text-xs px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700"
                      >
                        {joining === c._id ? "Leaving..." : "Joined"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(c._id)}
                        disabled={joining === c._id}
                        className="inline-flex items-center justify-center text-xs px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-600"
                      >
                        {joining === c._id ? "Joining..." : "Join"}
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
          <div className="flex justify-center py-10 text-neutral-400">
            Loading…
          </div>
        ) : displayedFeed.length === 0 ? (
          <div className="flex justify-center py-10 text-neutral-500">
            No posts yet.
          </div>
        ) : (
          displayedFeed.map((post) => (
            <PostCard
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

/** Twitter-style post card with community pill */
function PostCard({ post, onCommunityClick }) {
  const author = post.author || {};
  const community = post.community || {};
  const media = post.media || {};

  return (
    <div className="border-b border-neutral-800 px-4 py-3 flex gap-3">
      <img
        src={author.profilePic?.url}
        alt={author.name}
        className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-neutral-800"
      />
      <div className="flex-1 min-w-0">
        {/* Header line */}
        <div className="flex items-center gap-1 text-sm">
          <span className="font-semibold truncate">{author.name}</span>
          {author.userName && (
            <span className="text-xs text-neutral-500 truncate">
              @{author.userName}
            </span>
          )}
          {post.createdAt && (
            <span className="text-xs text-neutral-500">
              · {formatDate(post.createdAt)}
            </span>
          )}
        </div>

        {/* Community pill */}
        {community._id && (
          <button
            onClick={() => onCommunityClick(community._id)}
            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border border-neutral-700 bg-neutral-900 text-[11px] hover:bg-neutral-800"
          >
            <span className="text-[10px]">◎</span>
            <span className="truncate max-w-[140px]">
              {community.name || "Community"}
            </span>
          </button>
        )}

        {/* Text */}
        {post.description && (
          <p className="mt-2 text-sm leading-5 whitespace-pre-wrap">
            {post.description}
          </p>
        )}

        {/* Media */}
        {media.url && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-800">
            <img
              src={media.url}
              alt=""
              className="w-full max-h-[520px] object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
