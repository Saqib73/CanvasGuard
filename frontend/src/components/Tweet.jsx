function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useDisLikeMutation, useSendLikeMutation } from "../redux/api/api";
// import { useStore } from "../store";

export default function Tweet({ post }) {
  const { user } = useSelector((state) => state.auth);
  // const [isLiked, setIsLiked] = useState(false);
  const isLiked = post.likes.includes(user._id);
  const [sendLike, { sendLikeData, sendLikeIsLoading, sendLikeisError }] =
    useSendLikeMutation();
  const [disLike] = useDisLikeMutation();
  // const { users, toggleLike, toggleRepost } = useStore();
  // let isLiked = false;
  const author = post.author;
  const isReposted = false;

  const toggleLike = async () => {
    if (isLiked == false) {
      await sendLike({ postId: post._id });
    } else {
      await disLike({ postId: post._id });
    }
    // setIsLiked((prev) => !prev);
  };

  return (
    <div className="flex gap-3 p-4 border-b border-neutral-300 dark:border-neutral-800 hover:bg-neutral-800/50 dark:hover:bg-neutral-800/30 transition-colors duration-200">
      <Link to={`/artist/${author.userName}`}>
        <img
          alt="avatar"
          // src={post}
          className="h-10 w-10 rounded-full ring-1 ring-neutral-300 dark:ring-neutral-800"
        />
      </Link>
      <div className="flex-1">
        <div className="flex gap-2 items-center text-sm">
          <Link to={`/artist/${author.userName}`} className=" hover:underline">
            <span className="font-semibold text-cg-text">
              {author?.userName}
            </span>
          </Link>
          {author?.verified && <span className="text-sky-400">✔</span>}
          <Link to={`/artist/${author.userName}`}>
            <span className="text-neutral-500 dark:text-neutral-400">
              @{author?.userName}
            </span>
          </Link>
        </div>
        <Link
          to={`/post/${post._id}`}
          className="block whitespace-pre-wrap text-[15px] leading-5 mt-1 hover:underline text-cg-text"
        >
          {post.text}
        </Link>
        {post.media.url && (
          <Link
            to={`/post/${post._id}`}
            className="mt-2 block overflow-hidden rounded-2xl border border-neutral-300 dark:border-neutral-800 shadow-lg shadow-black/30"
          >
            <div className="relative">
              <img
                src={post.media.url}
                alt="media"
                className="max-h-[480px] w-full object-cover"
              />
              {post.watermarked && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-white/25 text-5xl font-black select-none rotate-[-20deg]">
                    CANVASGUARD
                  </div>
                </div>
              )}
            </div>
          </Link>
        )}
        <div className="flex gap-2 mt-2 text-xs text-neutral-500">
          {post.license?.includes("no_ai") && (
            <span className="cg-chip">No AI</span>
          )}
          {post.license?.includes("credit_required") && (
            <span className="cg-chip">Credit required</span>
          )}
          {post.license?.includes("no_commercial") && (
            <span className="cg-chip">No commercial</span>
          )}
        </div>
        <div className="flex justify-between text-neutral-500 dark:text-neutral-400 text-sm mt-3 max-w-md">
          <button
            className={`hover:text-sky-400 flex items-center gap-2 transition-colors duration-200`}
            onClick={() => {}}
          >
            <span>💬</span>
            <span>Reply</span>
          </button>
          <button
            className={`${
              isReposted ? "text-green-500" : "hover:text-green-500"
            } flex items-center gap-2 transition-colors duration-200`}
            onClick={() => toggleRepost(post.id, "me")}
          >
            <span>🔁</span>
            <span>
              {/* Repost {post.reposts.size ? formatCount(post.reposts.size) : ""} */}
            </span>
          </button>
          <button
            className={`${
              isLiked ? "text-pink-500" : "hover:text-pink-500"
            } flex items-center gap-2  duration-200 transition-transform`}
            onClick={toggleLike}
            disabled={sendLikeIsLoading}
          >
            {/* <span> */}
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            {/* </span> */}
            <span>{post.likes.size ? formatCount(post.likes.size) : ""}</span>
          </button>
          <button
            className="hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-2 transition-colors duration-200"
            onClick={() => {}}
          >
            <span>📤</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
