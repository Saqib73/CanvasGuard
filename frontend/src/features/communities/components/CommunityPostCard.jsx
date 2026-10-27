import { formatDate } from "../../../lib/utils";
import OptimizedImage from "../../../components/ui/OptimizedImage";

import { getAvatarUrl } from "../../../lib/avatar";
export const CommunityPostCard = ({ post, onCommunityClick }) => {
  const author = post.author || {};
  const community = post.community || {};
  const media = post.media || {};

  return (
    <div className="border-b border-base-300 px-4 py-3 flex gap-3">
      <img
        src={getAvatarUrl(author)}
        alt={author.name}
        className="h-10 w-10 rounded-full object-cover flex-shrink-0 bg-neutral-800"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-semibold truncate">{author.name}</span>
          {author.userName && (
            <span className="text-xs text-neutral-500 truncate">
              @{author.userName}
            </span>
          )}
          {post.createdAt && (
            <span className="text-xs text-neutral-500">
              · {formatDate(post.createdAt)}
            </span>
          )}
        </div>

        {community._id && (
          <button
            onClick={() => onCommunityClick && onCommunityClick(community._id)}
            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border border-base-300 bg-base-200 text-[11px] hover:bg-base-300"
          >
            <span className="text-[10px]">◎</span>
            <span className="truncate max-w-[140px]">
              {community.name || "Community"}
            </span>
          </button>
        )}

        {post.description && (
          <p className="mt-2 text-sm leading-5 whitespace-pre-wrap">
            {post.description}
          </p>
        )}

        {media.url && (
          <OptimizedImage
            src={media.url}
            width={media.width}
            height={media.height}
            blurDataUrl={media.blurDataUrl}
            alt={post.description || "Community post media"}
            sizes="(max-width: 640px) 100vw, 600px"
            wrapperClassName="mt-2 rounded-2xl border border-base-300"
            className="w-full h-auto max-h-[520px] object-cover"
          />
        )}
      </div>
    </div>
  );
};

export default CommunityPostCard;
