import { Link } from "react-router-dom";
import { LuClock } from "react-icons/lu";
import { getAvatarUrl } from "../../../lib/avatar";
import OptimizedImage from "../../../components/ui/OptimizedImage";

/**
 * One artist on the commissions list: who they are, their latest work, and a request button.
 * showAction={false} hides the button/badge (e.g. as the summary on the request form).
 */
export default function ArtistCard({ artist, isSelf, showAction = true }) {
  const user = artist.user || {};
  const open = artist.openForCommission;
  const work = artist.recentWork || [];

  return (
    <article className="border-b border-cg-border px-4 py-4">
      <div className="flex items-start gap-3">
        <Link to={`/artist/${user.userName}`} className="flex-shrink-0">
          <img src={getAvatarUrl(user)} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-cg-border" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <Link to={`/artist/${user.userName}`} className="min-w-0 hover:underline">
              <p className="truncate font-semibold leading-tight">{user.name}</p>
              <p className="truncate text-sm text-cg-muted">@{user.userName}</p>
            </Link>

            {!showAction ? null : isSelf ? (
              <span className="flex-shrink-0 rounded-full border border-cg-border px-3 py-1 text-xs font-medium text-cg-muted">
                You
              </span>
            ) : open ? (
              <Link
                to={`/commissions/${artist._id}`}
                className="btn btn-sm flex-shrink-0 rounded-full border-0 bg-cg-primary px-4 text-white hover:bg-cg-primary/90 dark:text-[#082f49]"
              >
                Request commission
              </Link>
            ) : (
              <span className="flex-shrink-0 rounded-full bg-cg-hover px-3 py-1 text-xs font-medium text-cg-muted">
                Commissions closed
              </span>
            )}
          </div>

          {artist.bio && <p className="mt-2 line-clamp-2 text-[15px] leading-5">{artist.bio}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cg-muted">
            {open && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Open
              </span>
            )}
            {artist.baseFee > 0 && (
              <span>
                From <span className="font-semibold text-cg-text">₹{artist.baseFee.toLocaleString("en-IN")}</span>
              </span>
            )}
            {artist.deliveryTime && (
              <span className="inline-flex items-center gap-1">
                <LuClock aria-hidden="true" /> {artist.deliveryTime}
              </span>
            )}
          </div>

          {artist.artStyles?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {artist.artStyles.map((style) => (
                <span key={style} className="rounded-full border border-cg-border px-2.5 py-0.5 text-xs">
                  {style}
                </span>
              ))}
            </div>
          )}

          {work.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl">
              {work.map((post) => (
                <Link key={post._id} to={`/post/${post._id}`} className="block aspect-square overflow-hidden bg-cg-hover">
                  <OptimizedImage
                    src={post.media.url}
                    width={post.media.width}
                    height={post.media.height}
                    blurDataUrl={post.media.blurDataUrl}
                    alt=""
                    sizes="180px"
                    wrapperClassName="h-full w-full"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
