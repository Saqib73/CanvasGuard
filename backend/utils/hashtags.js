const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

// A "#" at the start or after a non-word character (so "a#b" and URL fragments
// like "page#section" don't count), followed by letters, numbers or "_" in any script
const HASHTAG_RE = /(?:^|[^\p{L}\p{N}_&/#])#([\p{L}\p{N}_]+)/gu;

/**
 * Twitter-style hashtags from a post's text: lowercased, unique, in order of
 * appearance. Number-only tags like "#1" are ignored.
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  const tags = [];
  for (const [, raw] of text.matchAll(HASHTAG_RE)) {
    const tag = raw.toLowerCase();
    if (tag.length > MAX_TAG_LENGTH || /^\d+$/.test(tag) || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
};

// Normalizes a tag from a URL/query ("#Watercolor" -> "watercolor")
export const normalizeTag = (tag) =>
  typeof tag === "string" ? tag.trim().replace(/^#/, "").toLowerCase() : "";
