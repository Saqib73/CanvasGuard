import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { notificationKeys } from "./notifications.keys";

const request = (config) => apiClient(config).then((response) => response.data);

export const useNotifications = () =>
  useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => request({ url: "/user/notification" }),
  });
