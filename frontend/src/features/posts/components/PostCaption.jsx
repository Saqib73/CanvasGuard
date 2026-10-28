import { Link } from "react-router-dom";
import { HASHTAG_RE, isValidTag } from "../../../lib/hashtags";

/** Post text with #hashtags rendered as links to the tag's feed. */
export default function PostCaption({ text, className = "" }) {
  if (!text) return null;

  const parts = [];
  let last = 0;
  for (const match of text.matchAll(HASHTAG_RE)) {
    const [, prefix, tag] = match;
    if (!isValidTag(tag)) continue;
    const start = match.index + prefix.length;
    parts.push(text.slice(last, start));
    parts.push(
      <Link
        key={start}
        to={`/?tag=${encodeURIComponent(tag.toLowerCase())}`}
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:underline"
      >
        #{tag}
      </Link>
    );
    last = start + tag.length + 1;
  }
  parts.push(text.slice(last));

  return <p className={`whitespace-pre-wrap break-words ${className}`}>{parts}</p>;
}
