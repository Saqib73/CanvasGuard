import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { postKeys } from "./posts.keys";

const request = (config) => apiClient(config).then((response) => response.data);
const invalidatePosts = (queryClient) => queryClient.invalidateQueries({ queryKey: postKeys.all });

export const usePosts = (filters) => useQuery({
  queryKey: postKeys.list(filters),
  queryFn: () => request({ url: "/posts", params: filters }),
});

export const usePost = (postId) => useQuery({
  queryKey: postKeys.detail(postId),
  queryFn: () => request({ url: `/posts/${postId}` }),
  enabled: Boolean(postId),
});

export const useLikedPosts = () => useQuery({
  queryKey: postKeys.liked,
  queryFn: () => request({ url: "/user/getLikedPosts" }),
});

const usePostMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => invalidatePosts(queryClient) });
};

export const useCreatePost = () => usePostMutation((data) => request({ url: "/posts/createPost", method: "POST", data }));
export const useLikePost = () => usePostMutation((postId) => request({ url: "/posts/like", method: "POST", data: { postId } }));
export const useUnlikePost = () => usePostMutation((postId) => request({ url: "/posts/unlike", method: "POST", data: { postId } }));
export const useDeletePost = () => usePostMutation(({ postId, isStolen }) => request({ url: `/posts/${postId}`, method: "DELETE", data: { isStolen } }));

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, text }) => request({ url: "/comment", method: "POST", data: { postId, text } }),
    onSuccess: (_, { postId }) => queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) }),
  });
};
