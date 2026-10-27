import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { commissionKeys } from "./commissions.keys";

const request = (config) => apiClient(config).then((response) => response.data);

export const useCommissionArtists = (filters = {}) =>
  useQuery({
    queryKey: commissionKeys.artists(filters),
    queryFn: () => request({ url: "/commissions/get", params: filters }),
  });

export const useCommissionRequests = () =>
  useQuery({
    queryKey: commissionKeys.requests,
    queryFn: () =>
      request({
        url: "/commissions/getCommissionReqs",
        params: { artist: true },
      }),
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
