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
