import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { postKeys } from "./posts.keys";
import { communityKeys } from "../../communities/api/communities.keys";
import { profileKeys } from "../../profiles/api/profiles.keys";

const request = (config) => apiClient(config).then((response) => response.data);

// A post can be on screen in the feeds, a community or a profile: refresh all of them
const invalidatePosts = (queryClient) =>
  Promise.all(
    [postKeys.all, communityKeys.all, profileKeys.all].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );

export const usePosts = (filters) => useQuery({
  queryKey: postKeys.list(filters),
  queryFn: () => request({ url: "/posts", params: filters }),
});

export const usePost = (postId) => useQuery({
  queryKey: postKeys.detail(postId),
  queryFn: () => request({ url: `/posts/${postId}` }),
  enabled: Boolean(postId),
});

export const useLikedPosts = (options = {}) => useQuery({
  queryKey: postKeys.liked,
  queryFn: () => request({ url: "/user/getLikedPosts" }),
  ...options,
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
