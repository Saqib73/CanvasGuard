export const postKeys = {
  all: ["posts"],
  list: (filters = {}) => ["posts", "list", filters],
  detail: (postId) => ["posts", "detail", postId],
  liked: ["posts", "liked"],
};
