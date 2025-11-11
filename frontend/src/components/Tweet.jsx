function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useSelector } from "react-redux";
import {
  useDeletePostMutation,
  useDisLikeMutation,
  useSendLikeMutation,
} from "../redux/api/api";
import { BsThreeDots } from "react-icons/bs";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
// import { useStore } from "../store";

export default function Tweet({ post }) {
  const { user } = useSelector((state) => state.auth);
  // const [isLiked, setIsLiked] = useState(false);
  const isLiked = post.likes.includes(user._id);
  const [sendLike, { sendLikeData, sendLikeIsLoading, sendLikeisError }] =
    useSendLikeMutation();
  const [disLike] = useDisLikeMutation();
  const [isStolen, setIsStolen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [open, setOpen] = useState(false);

  const [deletePost, { isLoading: deleteIsLoading, isError, error }] =
    useDeletePostMutation();

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

  const verifyArtTheft = async () => {
    setOpen((p) => !p);
    setIsLoading(true);
    const toastId = toast.loading("Verifying...");
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/posts/verify`,
        {
          postId: post._id,
        },
        {
          withCredentials: true,
        }
      );
      toast.success(data.message, {
        id: toastId,
      });
      console.log(data);
      if (data.isStolen) {
        setIsStolen(true);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response.data?.message, {
        id: toastId,
      });
    } finally {
      setIsLoading(true);
    }
  };

  useEffect(() => {
    console.log(open);
  }, [open]);

  const handleRemove = async () => {
    setRemoving(true);
    const toastId = toast.loading("Removing Post");
    try {
      const { data } = await axios.delete(
        `${import.meta.env.VITE_SERVER}/api/v1/posts/${post._id}`,
        {
          data: { isStolen },
          withCredentials: true,
        }
      );
      toast.success(data.message, {
        id: toastId,
      });
      console.log(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response.data?.message || "Something wen wrong", {
        id: toastId,
      });
    } finally {
      setRemoving(false);
      setIsStolen(false);
    }
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
        <div className="flex gap-2 justify-between text-sm">
          <div className="flex gap-2 items-center text-sm">
            <Link
              to={`/artist/${author.userName}`}
              className=" hover:underline"
            >
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

          <div
            className={`mr-2 dropdown dropdown-end ${
              open ? "dropdown-open" : "dropdown-close"
            }`}
          >
            <button
              tabIndex={0}
              onClick={() => setOpen((p) => !p)}
              className=" hover:bg-blue-500/40 hover:shadow-[0_0_0_3px_rgba(29,155,240,0.3)] h-5 w-5 rounded-full flex justify-center items-center"
            >
              <BsThreeDots />
            </button>
            <ul
              tabIndex="-1"
              className={`dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm `}
            >
              <li>
                <a>Unfollow User</a>
              </li>
              <li>
                <button onClick={verifyArtTheft}>
                  Verify against Art theft
                </button>
              </li>
            </ul>
          </div>

          {isStolen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-cg-card border border-neutral-300 dark:border-neutral-700 rounded-xl p-6 shadow-xl w-80">
                <h3 className="font-semibold text-lg mb-4">
                  Art theft detected!
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                  This post appears to be originally yours. Do you want to
                  remove it?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsStolen(false)}
                    disabled={removing}
                    className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Yes, remove
                  </button>
                </div>
              </div>
            </div>
          )}
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
