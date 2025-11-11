import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Tweet from "../../components/Tweet.jsx";
import { useSelector } from "react-redux";
import {
  useGetAllLikedPostsQuery,
  useGetUserProfileQuery,
} from "../../redux/api/api.js";

export default function Profile() {
  const { userName } = useParams();
  const { data: user, isLoading: profileIsLoading } = useGetUserProfileQuery({
    userName,
  });
  const { user: authUser } = useSelector((state) => state.auth);
  const [mode, setMode] = useState("posts");
  // const { data, isLoading } = useGetMyPostsQuery();
  const { data, isLoading: likedPostsIsLoading } = useGetAllLikedPostsQuery();
  // console.log(userPosts);
  const isOwnProfile = authUser.userName === userName;

  // useEffect(() => {
  //   console.log("user-->", user);
  //   console.log(data);
  //   console.log(isError);
  //   // console.log(data);
  // }, [user, data, isError]);

  return profileIsLoading ? (
    <div>Loading...</div>
  ) : (
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Cover Photo */}
      <div className="w-full h-40 bg-sky-700" />

      {/* Profile Header */}
      <div className="px-4 -mt-10 flex items-end gap-4">
        <img
          // src={user}
          alt="avatar"
          className="h-24 w-24 rounded-full ring-4 ring-black"
        />
        <div className="flex-1" />
        {isOwnProfile && (
          <Link
            to="/edit-profile"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full border border-neutral-700 text-sm font-semibold"
          >
            Edit profile
          </Link>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 text-xl font-bold">
          {user.user.name}{" "}
          {user.user.verified && <span className="text-sky-400">✔</span>}
        </div>
        <div className="text-neutral-400">@{user.user.userName}</div>
      </div>

      <div className="px-4 mt-3 text-[15px] text-neutral-200">
        Download Free Exclusive PSD Files, PSD graphics, PSD Templates, PSD
        backgrounds and many PhotoShop resources.
      </div>

      <div className="px-4 mt-3 flex flex-wrap gap-4 text-sm text-neutral-400">
        <div className="flex items-center gap-2">
          <span>🔗</span>
          <a className="hover:underline" href="#">
            https://psd.zone
          </a>
        </div>
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span>Freiburg, Germany</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>Joined August 2022</span>
        </div>
      </div>

      <div className="px-4 mt-3 flex gap-6 text-sm">
        <div>
          <span className="font-semibold">{user.user.following.length}</span>{" "}
          <span className="text-neutral-400">Following</span>
        </div>
        <div>
          <span className="font-semibold">{user.user.followers.length}</span>{" "}
          <span className="text-neutral-400">Followers</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-4 border-b border-neutral-800 grid grid-cols-3 text-center text-sm">
        <button
          onClick={() => setMode("posts")}
          className={`py-3 ${
            mode === "posts"
              ? "font-semibold border-b-2 border-sky-500"
              : "text-neutral-400"
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setMode("media")}
          className={`py-3 ${
            mode === "media"
              ? "font-semibold border-b-2 border-sky-500"
              : "text-neutral-400"
          }`}
        >
          Media
        </button>
        <button
          onClick={() => setMode("likes")}
          className={`py-3 ${
            mode === "likes"
              ? "font-semibold border-b-2 border-sky-500"
              : "text-neutral-400"
          }`}
        >
          Likes
        </button>
      </div>

      {/* Content Area */}
      <div>
        {/* {mode === "media" ? (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {userPosts
              .filter((p) => p.mediaUrl)
              .map((p) => (
                <div
                  key={p.id}
                  className="relative overflow-hidden rounded-xl border border-neutral-800"
                >
                  <img
                    src={p.mediaUrl}
                    alt="art"
                    className="w-full h-56 object-cover"
                  />
                  {p.watermarked && (
                    <div className="absolute inset-0 grid place-items-center pointer-events-none">
                      <div className="text-white/25 text-3xl font-black select-none rotate-[-20deg]">
                        CANVASGUARD
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : ( */}
        <div>
          {mode == "posts" &&
            user.user.posts.map((p) => <Tweet key={p._id} post={p} />)}

          {mode == "likes" &&
            (likedPostsIsLoading ? (
              <div>Loading...</div>
            ) : (
              data.allLikedPosts.likedPosts.map((p) => (
                <Tweet key={p._id} post={p} />
              ))
            ))}
        </div>
        {/* )} */}
      </div>
    </div>
  );
}
