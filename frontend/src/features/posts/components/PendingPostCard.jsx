import { MdOutlineShield, MdRefresh } from "react-icons/md";
import { FaTimes } from "react-icons/fa";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import { getAvatarUrl } from "../../../lib/avatar";
import { discardPost, retryPost } from "../pendingPosts";

const STAGE_LABEL = {
  uploading: (progress) => `Posting… ${Math.round(progress * 100)}%`,
  processing: () => "Protecting your artwork…",
  failed: () => "Couldn't send this post",
};

/** A post that's still being sent, shown at the top of the feed (Twitter-style). */
export default function PendingPostCard({ item }) {
  const { data: user } = useCurrentUser();
  const { stage, progress, description, previewUrl, error } = item;
  const failed = stage === "failed";

  return (
    <div className="relative flex gap-3 border-b border-cg-border p-4">
      {/* Progress bar along the top edge: real progress while uploading, indeterminate while watermarking */}
      {!failed && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-cg-border">
          {stage === "uploading" ? (
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.max(progress, 0.03) * 100}%` }}
            />
          ) : (
            <div className="cg-progress-indeterminate h-full w-1/3 bg-primary" />
          )}
        </div>
      )}

      <img
        alt=""
        src={getAvatarUrl(user)}
        className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-1 ring-cg-border"
      />
      <div className="min-w-0 flex-1">
        <div className={`flex items-center gap-2 text-xs font-medium ${failed ? "text-error" : "text-cg-muted"}`}>
          {stage === "processing" && <MdOutlineShield className="text-primary" />}
          {STAGE_LABEL[stage](progress)}
        </div>

        {description && (
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-5 text-cg-text/70">
            {description}
          </p>
        )}

        {previewUrl && (
          <img
            src={previewUrl}
            alt=""
            className={`mt-2 max-h-72 rounded-2xl border border-cg-border object-cover ${failed ? "" : "opacity-60"}`}
          />
        )}

        {stage === "processing" && (
          <p className="mt-2 text-xs text-cg-muted">
            Only you can see this until the watermark is added. You can keep browsing.
          </p>
        )}

        {failed && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-cg-muted">{error}</span>
            <button
              type="button"
              onClick={() => retryPost(item.id)}
              className="btn btn-primary btn-xs rounded-full"
            >
              <MdRefresh /> Retry
            </button>
            <button
              type="button"
              onClick={() => discardPost(item.id)}
              className="btn btn-ghost btn-xs rounded-full"
            >
              <FaTimes /> Discard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
