import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { authKeys } from "../../auth/api/auth.keys";
import { postKeys } from "../../posts/api/posts.keys";
import { profileKeys } from "./profiles.keys";

const request = (config) => apiClient(config).then((response) => response.data);

export const useUserProfile = (userName) => useQuery({
  queryKey: profileKeys.detail(userName),
  queryFn: () => request({ url: `/user/${userName}` }),
  enabled: Boolean(userName),
});

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => request({ url: "/user/me", method: "PUT", data: formData }),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser, data.user);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

const useFollowMutation = (path) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetId) => request({ url: path, method: "POST", data: { targetId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  });
};

export const useFollowUser = () => useFollowMutation("/user/follow");
export const useUnfollowUser = () => useFollowMutation("/user/unfollow");
