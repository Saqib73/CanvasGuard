import { useState } from "react";
import toast from "react-hot-toast";
import { useCreatePost } from "../api/posts.hooks";
import { getErrorMessage } from "../../../lib/api-client";

export default function Composer() {
  const [text, setText] = useState("");
  // const [isCreating, setIsCreating] = useState(false);
  const { mutateAsync: createPost, isPending } = useCreatePost();

  // const handlePost = async () => {
  //   setIsCreating(true);

  //   const toastId = toast.loading("Creating Post...");
  //   try {
  //     const { data } = await axios.post(
  //       `${import.meta.env.VITE_SERVER}/api/v1/posts/createPost`,
  //       {
  //         description: text,
  //         isArt: false,
  //       },
  //       {
  //         withCredentials: true,
  //       }
  //     );
  //     toast.success(data.message, {
  //       id: toastId,
  //     });
  //     console.log(data);
  //   } catch (error) {
  //     console.error(error);
  //     toast.error(error?.response?.data?.message || "Something Went Wrong", {
  //       id: toastId,
  //     });
  //   } finally {
  //     setIsCreating(false);
  //   }
  // };

  const handlePost = async () => {
    try {
      await createPost({
        description: text,
        isArt: false,
      });
      toast.success("Post created");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
    finally {
      setText("");
    }
  };

  return (
    <div className="flex gap-3 p-4 border-b border-neutral-300 dark:border-neutral-800 transition-colors duration-200">
      <div className="h-10 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 ring-1 ring-neutral-300 dark:ring-neutral-800" />
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What is happening?!"
          className="w-full bg-transparent outline-none resize-none min-h-16 text-lg placeholder:text-neutral-500 dark:placeholder:text-neutral-500 text-cg-text"
        />
        <div className="flex justify-between items-center pt-2">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">
            Compose
          </div>
          <button
            disabled={isPending || !text.trim()}
            onClick={handlePost}
            className="btn btn-primary btn-sm rounded-full"
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
