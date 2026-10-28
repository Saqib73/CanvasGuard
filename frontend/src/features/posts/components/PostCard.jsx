function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

import { Link, useNavigate } from "react-router-dom";
import { MdOutlineShield } from "react-icons/md";
import PostCaption from "./PostCaption";
import { LuEllipsis, LuHeart, LuMessageCircle, LuRepeat2, LuShare, LuUsers } from "react-icons/lu";
import { useDeletePost, useLikePost, useUnlikePost } from "../api/posts.hooks";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import OptimizedImage from "../../../components/ui/OptimizedImage";
import axios from "axios";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { PostCardSkeleton } from "../../../components/ui/Skeleton";

import { getAvatarUrl } from "../../../lib/avatar";
// import { useStore } from "../store";

// showCommunity: false on a community's own page, where "in <community>" would be redundant
export default function Tweet({ post, showCommunity = true }) {
  const { data: user, isLoading: loader } = useCurrentUser();
  // const [isLiked, setIsLiked] = useState(false);
  const isLiked = post.likes.includes(user._id);
  const { mutateAsync: sendLike, isPending: isLiking } = useLikePost();
  const { mutateAsync: disLike, isPending: isUnliking } = useUnlikePost();
  const [isStolen, setIsStolen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [open, setOpen] = useState(false);

  const isPostAuthor = post.author.userName == user.userName;

  const menuRef = useRef(null);
  const navigate = useNavigate();

  const { mutateAsync: deletePost } = useDeletePost();

  const author = post.author;
  const isReposted = false;

  const toggleLike = async () => {
    if (isLiked == false) {
      await sendLike(post._id);
    } else {
      await disLike(post._id);
    }
    // setIsLiked((prev) => !prev);
  };

  const verifyArtTheft = async () => {
    setOpen((p) => !p);
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
      if (data.isStolen) {
        setIsStolen(true);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response.data?.message, {
        id: toastId,
      });
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    const toastId = toast.loading("Removing Post");
    try {
      const res = await deletePost({
        postId: post._id,
        isStolen,
      });
      toast.success(res?.message, {
        id: toastId,
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something wen wrong", {
        id: toastId,
      });
    } finally {
      setRemoving(false);
      setIsStolen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loader) return <PostCardSkeleton withMedia={Boolean(post?.media?.url)} />;

  return (
    <div className="flex gap-3 p-4 border-b border-cg-border hover:bg-cg-hover transition-colors duration-200">
      <Link to={`/artist/${author.userName}`}>
        <img
          alt="avatar"
          src={getAvatarUrl(post.author)}
          className="h-10 w-10 rounded-full object-cover ring-1 ring-cg-border"
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
              <span className="text-cg-muted">
                @{author?.userName}
              </span>
            </Link>
          </div>

          <div
            ref={menuRef}
            className={`mr-2 dropdown dropdown-end ${
              open ? "dropdown-open" : "dropdown-close"
            }`}
          >
            <button
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((p) => !p);
              }}
              aria-label="More options"
              className="grid h-8 w-8 place-items-center rounded-full text-cg-muted transition-colors hover:bg-sky-500/10 hover:text-sky-500"
            >
              <LuEllipsis className="text-[18px]" />
            </button>
            <ul
              tabIndex="-1"
              className={`dropdown-content menu bg-cg-surface border border-cg-border rounded-box z-1 w-52 p-2 shadow-sm `}
            >
              <li className="justify-start w-full h-auto min-h-0 px-1 py-2 text-left text-sm hover:bg-cg-hover hover:rounded-md hover:cursor-pointer">
                <button onClick={() => setOpen((p) => !p)}>
                  Unfollow User
                </button>
              </li>
              {!isPostAuthor && (
                <li className="justify-start w-full h-auto min-h-0 px-1 py-2 text-left text-sm hover:bg-cg-hover hover:rounded-md hover:cursor-pointer">
                  <button onClick={verifyArtTheft}>
                    Verify against Art theft
                  </button>
                </li>
              )}
              {isPostAuthor && (
                <li className="justify-start w-full h-auto min-h-0 px-1 py-2 text-left text-sm hover:bg-cg-hover hover:rounded-md hover:cursor-pointer">
                  <button onClick={handleRemove}>Delete Post</button>
                </li>
              )}
            </ul>
          </div>

          {isStolen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-cg-surface border border-cg-border rounded-xl p-6 shadow-xl w-80">
                <h3 className="font-semibold text-lg mb-4">
                  Art theft detected!
                </h3>
                <p className="text-sm text-cg-muted mb-6">
                  This post appears to be originally yours. Do you want to
                  remove it?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsStolen(false)}
                    disabled={removing}
                    className="px-4 py-2 rounded-lg border border-cg-border hover:bg-cg-hover"
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
        {/* Only when the community comes populated (community feeds), so the home feed stays as is */}
        {showCommunity && post.community?.name && (
          <Link
            to={`/communities/${post.community._id}`}
            className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs text-cg-muted hover:text-cg-primary"
          >
            <LuUsers className="flex-shrink-0" aria-hidden="true" />
            <span className="truncate">in {post.community.name}</span>
          </Link>
        )}
        {/* Not a <Link>: hashtags inside are links themselves */}
        {post.description && (
          <div
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/post/${post._id}`)}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/post/${post._id}`)}
            className="mt-1 cursor-pointer"
          >
            <PostCaption text={post.description} className="text-[15px] leading-5 text-cg-text" />
          </div>
        )}
        {post?.media?.url && (
          <Link
            to={`/post/${post._id}`}
            className="mt-2 block overflow-hidden rounded-2xl border border-cg-border"
          >
            <OptimizedImage
              src={post.media.url}
              width={post.media.width}
              height={post.media.height}
              blurDataUrl={post.media.blurDataUrl}
              alt={post.description || "Post media"}
              sizes="(max-width: 640px) 100vw, 600px"
              className="max-h-[480px] w-full h-auto object-cover"
            />
          </Link>
        )}
        {(post.status === "processing" || post.media?.isWaterMarked || post.license?.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-cg-muted">
            {post.status === "processing" && (
              <span className="cg-chip gap-1 text-primary">
                <MdOutlineShield /> Protecting… only you can see this
              </span>
            )}
            {post.status !== "processing" && post.media?.isWaterMarked && (
              <span className="cg-chip gap-1" title="Visible and invisible watermark applied">
                <MdOutlineShield /> Watermarked
              </span>
            )}
            {post.license?.includes("no_ai") && <span className="cg-chip">No AI training</span>}
            {post.license?.includes("credit_required") && <span className="cg-chip">Credit required</span>}
            {post.license?.includes("no_commercial") && <span className="cg-chip">No commercial use</span>}
          </div>
        )}
        <div className="flex justify-between text-cg-muted text-sm mt-3 max-w-md -ml-2">
          <Link
            to={`/post/${post._id}`}
            className="group flex items-center gap-1 transition-colors hover:text-sky-500"
            aria-label="Reply"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full transition-colors group-hover:bg-sky-500/10">
              <LuMessageCircle className="text-[18px]" aria-hidden="true" />
            </span>
            <span>{post.comments?.length ? formatCount(post.comments.length) : ""}</span>
          </Link>
          <button
            type="button"
            onClick={() => {}}
            className={`group flex items-center gap-1 transition-colors ${
              isReposted ? "text-green-500" : "hover:text-green-500"
            }`}
            aria-label="Repost"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full transition-colors group-hover:bg-green-500/10">
              <LuRepeat2 className="text-[18px]" aria-hidden="true" />
            </span>
          </button>
          <button
            type="button"
            onClick={toggleLike}
            disabled={isLiking || isUnliking}
            className={`group flex items-center gap-1 transition-colors ${
              isLiked ? "text-pink-500" : "hover:text-pink-500"
            }`}
            aria-label={isLiked ? "Unlike" : "Like"}
            aria-pressed={isLiked}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full transition-colors group-hover:bg-pink-500/10">
              <LuHeart className={`text-[18px] ${isLiked ? "fill-current" : ""}`} aria-hidden="true" />
            </span>
            <span>{post.likes?.length ? formatCount(post.likes.length) : ""}</span>
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="group flex items-center gap-1 transition-colors hover:text-sky-500"
            aria-label="Share"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full transition-colors group-hover:bg-sky-500/10">
              <LuShare className="text-[18px]" aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
