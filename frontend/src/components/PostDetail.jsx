import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Tweet from "./Tweet.jsx";
import { useGetPostQuery } from "../redux/api/api.js";
import axios from "axios";
import toast from "react-hot-toast";

export default function PostDetail() {
  const { postId } = useParams();
  console.log(postId);
  const { data, isLoading } = useGetPostQuery({ postId });
  // const { posts, users, addComment } = useStore();
  // const post = posts.find((p) => p.id === id);
  const [comment, setComment] = useState("");

  const addComment = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Adding comment...");
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/comment`,
        {
          text: comment,
          postId,
        },
        {
          withCredentials: true,
        }
      );
      console.log("comment->", data);
      toast.success(data.message, {
        id: toastId,
      });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Something Went Wrong", {
        id: toastId,
      });
    } finally {
      setComment("");
    }
  };
  useEffect(() => {
    console.log(data);
  }, [data]);

  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 backdrop-blur bg-black/60 border-b border-neutral-800 p-3 font-semibold">
        Post
      </div>
      <Tweet post={data.post} />
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
              disabled={!comment.trim()}
              onClick={addComment}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-full font-semibold"
            >
              Reply
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
                src={r.author.profilePic}
                className="h-9 w-9 rounded-full ring-1 ring-neutral-800"
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
