// Initials placeholder for users without a profile picture. Generated as an inline SVG
// data URI, so it needs no network request and works anywhere an <img src> does.

const PALETTE = [
  ["#0ea5e9", "#0369a1"],
  ["#8b5cf6", "#5b21b6"],
  ["#f59e0b", "#b45309"],
  ["#10b981", "#047857"],
  ["#ec4899", "#be185d"],
  ["#6366f1", "#3730a3"],
  ["#ef4444", "#b91c1c"],
  ["#14b8a6", "#0f766e"],
];

const cache = new Map();

export const getInitials = (name = "", userName = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return String(userName).replace(/^@/, "").slice(0, 2).toUpperCase() || "?";
};

// Same person always gets the same color
const pickColors = (seed) => {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export const getPlaceholderAvatar = (name, userName) => {
  const initials = getInitials(name, userName);
  const key = `${initials}|${userName || name}`;
  if (cache.has(key)) return cache.get(key);

  const [from, to] = pickColors(userName || name || initials);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="96" height="96" fill="url(#g)"/>
<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="38" font-weight="600" fill="#fff">${initials.replace(/[<>&]/g, "")}</text>
</svg>`;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
};

/** Profile picture URL, or an initials placeholder when the user has none. */
export const getAvatarUrl = (user) =>
  user?.profilePic?.url || getPlaceholderAvatar(user?.name, user?.userName);
