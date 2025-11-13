export const formattedDate = (user) => {
  return new Date(user?.createdAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
  });
};
