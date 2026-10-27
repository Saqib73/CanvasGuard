import { QueryClient } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { authKeys } from "../features/auth/api/auth.keys";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

/**
 * Forget the signed-in user and everything fetched as them. Setting the user
 * to null (rather than clear()) notifies App's observer, so the router
 * redirects to /login instead of re-rendering pages with a dead session.
 */
export const signOutLocally = () => {
  queryClient.setQueryData(authKeys.currentUser, null);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.currentUser[0] });
};

// Cookie expired or was cleared elsewhere: send the user back to login
apiClient.interceptors.response.use(undefined, (error) => {
  if (error?.response?.status === 401 && queryClient.getQueryData(authKeys.currentUser)) {
    signOutLocally();
  }
  return Promise.reject(error);
});
