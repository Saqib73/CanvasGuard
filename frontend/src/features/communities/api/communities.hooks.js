import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { communityKeys } from "./communities.keys";

const request = (config) => apiClient(config).then((response) => response.data);

export const useCommunities = () =>
  useQuery({
    queryKey: communityKeys.all,
    queryFn: () => request({ url: "/community/all" }),
  });

export const useMyCommunities = () =>
  useQuery({
    queryKey: communityKeys.mine,
    queryFn: () => request({ url: "/community/my" }),
  });

export const useCommunityFeed = (feed) =>
  useQuery({
    queryKey: communityKeys.feed(feed),
    queryFn: () => request({ url: `/community/feed/${feed}` }),
  });

// One community with its members and posts
export const useCommunity = (id) =>
  useQuery({
    queryKey: communityKeys.detail(id),
    queryFn: () => request({ url: `/community/${id}` }),
    enabled: Boolean(id),
  });

const useCommunityMembershipMutation = (action) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (communityId) =>
      request({ url: `/community/${action}/${communityId}`, method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      queryClient.invalidateQueries({ queryKey: communityKeys.mine });
    },
  });
};

export const useJoinCommunity = () => useCommunityMembershipMutation("join");
export const useLeaveCommunity = () => useCommunityMembershipMutation("leave");

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      request({
        url: "/community/create",
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      queryClient.invalidateQueries({ queryKey: communityKeys.mine });
    },
  });
};
