import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { authKeys } from "./auth.keys";
import { signOutLocally } from "../../../lib/query-client";

const request = (config) => apiClient(config).then((response) => response.data);

export const useCurrentUser = () => useQuery({
  queryKey: authKeys.currentUser,
  queryFn: () => request({ url: "/user/me" }),
  retry: false,
  staleTime: 5 * 60 * 1000,
});

const useAuthenticatedMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (!data?.user) return;
      // Switch screens immediately, then refetch the fully populated /user/me
      queryClient.setQueryData(authKeys.currentUser, data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
    },
  });
};

// credentials: { identifier (email or username), password }
export const useLogin = () => useAuthenticatedMutation((credentials) =>
  request({ url: "/auth/login", method: "POST", data: credentials })
);

export const useVerifySignup = () => useAuthenticatedMutation(({ userId, otp }) =>
  request({ url: "/auth/verify", method: "POST", data: { userId, otp } })
);

export const useResendOtp = () => useMutation({
  mutationFn: ({ userId }) =>
    request({ url: "/auth/resend-otp", method: "POST", data: { userId } }),
});

export const useCompleteArtistSetup = () => useAuthenticatedMutation((data) =>
  request({ url: "/auth/artistProfile", method: "POST", data })
);

export const useSignup = () => useMutation({
  mutationFn: (formData) => request({ url: "/auth/signup", method: "POST", data: formData }),
});

export const useLogout = () => useMutation({
  mutationFn: () => request({ url: "/auth/logout" }).catch((error) => {
    // No valid session left to end on the server: that's still a logout
    if (error?.response?.status === 401) return { message: "Logged out" };
    throw error;
  }),
  onSuccess: signOutLocally,
});
