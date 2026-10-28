// Same rules as the server's utils/hashtags.js: "#" at the start or after a non-word
// character, letters/numbers/_ in any script, not number-only, at most 50 characters
export const HASHTAG_RE = /(^|[^\p{L}\p{N}_&/#])#([\p{L}\p{N}_]+)/gu;

const MAX_TAGS = 10;

export const isValidTag = (tag) => tag.length <= 50 && !/^\d+$/.test(tag);

/** The tags the server will save for this text: lowercased, unique, max 10. */
export const extractHashtags = (text) => {
  const tags = [];
  for (const [, , raw] of (text || "").matchAll(HASHTAG_RE)) {
    const tag = raw.toLowerCase();
    if (!isValidTag(tag) || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
};
