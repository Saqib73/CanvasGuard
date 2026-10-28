export const formattedDate = (user) => {
  return new Date(user?.createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
  });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const RELATIVE_UNITS = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];
const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 days ago", "in 12 days", "tomorrow", "just now" */
export const formatRelative = (dateStr) => {
  if (!dateStr) return "";
  const seconds = (new Date(dateStr).getTime() - Date.now()) / 1000;
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return "just now";
};
