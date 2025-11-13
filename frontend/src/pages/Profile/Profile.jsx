import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Tweet from "../../components/Tweet.jsx";
import { useSelector } from "react-redux";
import {
  useFollowUserMutation,
  useGetAllLikedPostsQuery,
  useGetUserProfileQuery,
  useUnFollowUserMutation,
} from "../../redux/api/api.js";
import axios from "axios";
import toast from "react-hot-toast";
import { formattedDate } from "../../helpers/utils.js";

export default function Profile() {
  const { userName } = useParams();
  const { data: user, isLoading: profileIsLoading } = useGetUserProfileQuery({
    userName,
  });
  const { user: authUser } = useSelector((state) => state.auth);
  const [mode, setMode] = useState("posts");
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  // const { data, isLoading } = useGetMyPostsQuery();
  const { data, isLoading: likedPostsIsLoading } = useGetAllLikedPostsQuery();
  const [followUser] = useFollowUserMutation();
  const [UnfollowUser] = useUnFollowUserMutation();
  // console.log(userPosts);
  const isOwnProfile = authUser.userName === userName;
  const [isFollowing, setIsFollowing] = useState(false);

  const [joined, setJoined] = useState("");

  const handleFollow = async () => {
    const toastId = toast.loading("Following...");
    try {
      const data = await followUser({ targetId: user.user._id }).unwrap();
      toast.success(data?.message, {
        id: toastId,
      });
      console.log(data);
      setIsFollowing(true);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong", {
        id: toastId,
      });
    }
  };

  const handleUnfollow = async () => {
    const toastId = toast.loading("UnFollowing...");
    try {
      const data = await UnfollowUser({ targetId: user.user._id }).unwrap();
      toast.success(data?.message, {
        id: toastId,
      });
      console.log(data);
      setIsFollowing(false);
      setConfirmUnfollow(false);
    } catch (error) {
      console.log("error->", error);
      toast.error(error.response?.data?.message || "Something went wrong", {
        id: toastId,
      });
    }
  };

  useEffect(() => {
    if (user && authUser) {
      const isFollowed = user.user.followers.some(
        (f) => f._id === authUser._id
      );
      console.log(isFollowed);
      setIsFollowing(isFollowed);
    }
    setJoined(formattedDate(user?.user));
  }, [user?.user.followers, authUser, user]);

  useEffect(() => {
    console.log("user-->", user);
    // console.log(data);
    // console.log(isError);
    // console.log(data);
  }, [user]);

  return profileIsLoading ? (
    <div>Loading...</div>
  ) : (
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Cover Photo */}
      <div className="w-full h-40 bg-sky-700" />

      {/* Profile Header */}
      <div className="px-4 -mt-10 flex items-end gap-4">
        <img
          src={user.user?.profilePic?.url}
          alt="avatar"
          className="h-24 w-24 rounded-full ring-4 object-cover ring-black"
        />
        <div className="flex-1" />
        {isOwnProfile ? (
          <Link
            to="/edit-profile"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-full border border-neutral-700 text-sm font-semibold"
          >
            Edit profile
          </Link>
        ) : (
          <div>
            <button
              // disabled={isLoading}
              onClick={
                isFollowing ? () => setConfirmUnfollow(true) : handleFollow
              }
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                isFollowing
                  ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                  : "bg-sky-600 hover:bg-sky-500 border-sky-500 text-white"
              }`}
            >
              {profileIsLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>

            {/* Unfollow modal */}
            {confirmUnfollow && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-80 text-center shadow-xl">
                  <p className="text-neutral-200 text-xl font-medium mb-4 text-start">
                    Unfollow @{user.user.userName}?
                  </p>
                  <p className="font-light text-start text-gray-400">
                    Their posts will no longer show up in your Following
                    timeline. You can still view their profile, unless their
                    posts are protected.
                  </p>
                  <div className="flex justify-center gap-4 mt-4">
                    <button
                      onClick={() => setConfirmUnfollow(false)}
                      className="px-4 py-1 rounded-full text-md border border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUnfollow}
                      className="px-4 py-1 rounded-full text-md bg-red-600 hover:bg-red-500 text-white font-semibold"
                    >
                      Unfollow
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
        {user.user.bio}
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
          <span>{joined}</span>
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
