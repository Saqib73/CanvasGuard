import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { commissionKeys } from "./commissions.keys";

const request = (config) => apiClient(config).then((response) => response.data);

export const useCommissionArtists = (filters = {}) =>
  useQuery({
    queryKey: commissionKeys.artists(filters),
    queryFn: () => request({ url: "/commissions/get", params: filters }),
    // Keep showing the last results while new filters load, instead of a skeleton per keystroke
    placeholderData: keepPreviousData,
  });

// One artist's commission profile (ArtistProfile id or User id)
export const useCommissionArtist = (id) =>
  useQuery({
    queryKey: commissionKeys.artist(id),
    queryFn: () => request({ url: `/commissions/artist/${id}` }),
    enabled: Boolean(id),
  });

// role: "received" (requests sent to me as an artist) or "sent" (requests I made)
export const useCommissionRequests = (role = "received", options = {}) =>
  useQuery({
    queryKey: commissionKeys.requestList(role),
    queryFn: () =>
      request({
        url: "/commissions/getCommissionReqs",
        params: { artist: role === "received" },
      }),
    ...options,
  });

export const useRespondToCommission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }) =>
      request({
        url: `/commissions/confirmCommissionReq/${id}`,
        method: "POST",
        data: { accept },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commissionKeys.requests }),
  });
};

export const useCreateCommissionRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      request({
        url: "/commissions/requestCommission",
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: commissionKeys.requests }),
  });
};
