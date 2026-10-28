import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineImage } from "react-icons/md";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import { getAvatarUrl } from "../../../lib/avatar";
import { submitPost } from "../pendingPosts";
import { postButtonClass } from "../styles";

/** Quick text post at the top of the feed; adding an image opens the full post page. */
export default function Composer() {
  const [text, setText] = useState("");
  const { data: user } = useCurrentUser();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handlePost = () => {
    const description = text.trim();
    if (!description) return;
    const formData = new FormData();
    formData.append("description", description);
    submitPost(formData, { description });
    setText("");
  };

  // Image posts have options (artwork, watermark, labels), so continue on the post page
  const handleImagePicked = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) navigate("/post", { state: { file, text } });
  };

  return (
    <div className="flex gap-3 p-4">
      <img
        alt=""
        src={getAvatarUrl(user)}
        className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-1 ring-cg-border"
      />
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
          }}
          placeholder="What is happening?! Add #tags to help people find it"
          className="w-full bg-transparent outline-none resize-none min-h-16 text-lg placeholder:text-cg-muted text-cg-text"
        />
        <div className="flex justify-between items-center pt-2 border-t border-cg-border">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost btn-sm btn-circle text-xl text-cg-primary hover:bg-cg-primary/10"
            title="Add an image"
            aria-label="Add an image"
          >
            <MdOutlineImage />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePicked}
            className="hidden"
          />
          <button
            disabled={!text.trim()}
            onClick={handlePost}
            className={postButtonClass}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
