import { useParams } from "react-router-dom";
import { useState } from "react";
import PostCard from "./PostCard.jsx";
import { useAddComment, usePost } from "../api/posts.hooks.js";
import { getErrorMessage } from "../../../lib/api-client";
import toast from "react-hot-toast";
import { PostDetailSkeleton } from "../../../components/ui/Skeleton";

import { getAvatarUrl } from "../../../lib/avatar";
export default function PostDetail() {
  const { postId } = useParams();
  const { data, isLoading, isError } = usePost(postId);
  const { mutateAsync: submitComment, isPending } = useAddComment();
  const [comment, setComment] = useState("");

  const addComment = async (e) => {
    e.preventDefault();
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
    <div className="p-6 text-center text-neutral-500">This post could not be loaded.</div>
  ) : (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 backdrop-blur bg-black/60 border-b border-neutral-800 p-3 font-semibold">
        Post
      </div>
      <PostCard post={data.post} />
      <div className="p-4 min-h-[50vh]">
        <div className="cg-card p-4">
          <div className="font-semibold mb-2">Add a comment</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your reply..."
            className="w-full bg-transparent outline-none resize-none min-h-20"
          />
          <div className="flex justify-end">
            <button
              disabled={!comment.trim() || isPending}
              onClick={addComment}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-full font-semibold"
            >
              {isPending ? "Replying..." : "Reply"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          {data.post.comments?.map((r) => (
            <div
              key={r._id}
              className="flex gap-3 p-4 border-b border-neutral-800"
            >
              <img
                alt="avatar"
                src={getAvatarUrl(r.author)}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-neutral-800"
              />
              <div>
                <div className="text-sm text-neutral-300">
                  <span className="font-semibold">{r.author.userName}</span>
                  <span className="text-neutral-500 ml-2">
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
