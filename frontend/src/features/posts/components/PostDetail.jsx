import { useParams } from "react-router-dom";
import { useState } from "react";
import PostCard from "./PostCard.jsx";
import { useAddComment, usePost } from "../api/posts.hooks.js";
import { getErrorMessage } from "../../../lib/api-client";
import toast from "react-hot-toast";
import { PostDetailSkeleton } from "../../../components/ui/Skeleton";


import { getAvatarUrl } from "../../../lib/avatar";
import { useCurrentUser } from "../../auth/api/auth.hooks";
export default function PostDetail() {
  const { postId } = useParams();
  const { data, isLoading, isError } = usePost(postId);
  const { mutateAsync: submitComment, isPending } = useAddComment();
  const [comment, setComment] = useState("");
  const { data: currentUser } = useCurrentUser();

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isPending) return;
    const toastId = toast.loading("Adding comment...");
    try {
      const data = await submitComment({ text: comment, postId });
      toast.success(data.message, {
        id: toastId,
      });
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error), {
        id: toastId,
      });
    } finally {
      setComment("");
    }
  };

  return isLoading ? (
    <PostDetailSkeleton />
  ) : isError || !data?.post ? (
    <div className="p-6 text-center text-cg-muted">This post could not be loaded.</div>
  ) : (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 backdrop-blur-md bg-cg-bg/80 border-b border-cg-border p-3 font-semibold">
        Post
      </div>
      <PostCard post={data.post} />
      <div className="min-h-[50vh]">
        <form onSubmit={addComment} className="flex gap-3 border-b border-cg-border p-4">
          <img
            alt=""
            src={getAvatarUrl(currentUser)}
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-1 ring-cg-border"
          />
          <div className="flex-1">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addComment(e);
              }}
              placeholder="Post your reply"
              rows={1}
              className="[field-sizing:content] min-h-11 max-h-60 w-full resize-none bg-transparent py-2 text-lg text-cg-text outline-none placeholder:text-cg-muted"
            />
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!comment.trim() || isPending}
                className="btn btn-primary btn-sm rounded-full px-5"
              >
                {isPending ? "Replying..." : "Reply"}
              </button>
            </div>
          </div>
        </form>

        <div>
          {data.post.comments?.map((r) => (
            <div
              key={r._id}
              className="flex gap-3 p-4 border-b border-cg-border"
            >
              <img
                alt="avatar"
                src={getAvatarUrl(r.author)}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-cg-border"
              />
              <div>
                <div className="text-sm text-cg-text">
                  <span className="font-semibold">{r.author.userName}</span>
                  <span className="text-cg-muted ml-2">
                    @{r.author.userName}
                  </span>
                </div>
                <div className="text-[15px] leading-5 mt-1 whitespace-pre-wrap">
                  {r.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
