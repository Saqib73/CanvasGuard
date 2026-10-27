import { useEffect, useState } from "react";
import { useSocket } from "../../../socket";
import { useNotifications } from "../api/notifications.hooks";
import { NotificationListSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Card } from "../../../components/ui/Card";

export const NotificationsPage = () => {
  const socket = useSocket();
  const { data, isLoading, isError } = useNotifications();
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;
    socket.on("warning", (notif) => {
      setLiveNotifications((prev) => [notif, ...prev]);
    });
    return () => socket.off("warning");
  }, [socket]);

  const allNotifications = [...liveNotifications, ...(data?.notifications || [])];

  return (
    <div className="h-full overflow-y-auto no-scrollbar max-w-xl mx-auto p-4 space-y-4">
      <div className="sticky top-0 z-10 backdrop-blur bg-base-100/80 py-3 border-b border-base-300">
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>

      {isError && (
        <p className="text-sm text-error text-center py-4">Could not load notifications.</p>
      )}

      {isLoading && <NotificationListSkeleton />}

      {!isLoading && allNotifications?.length === 0 && !isError && (
        <EmptyState
          title="No notifications yet"
          description="We'll notify you when someone interacts with your posts or profile."
        />
      )}

      <div className="space-y-3">
        {allNotifications.map((n) => (
          <Card key={n._id || n.createdAt} padding={true} className="border border-base-300">
            <p className="text-base font-medium">{n.message}</p>
            <span className="text-xs text-neutral-500 mt-1 block">
              {new Date(n.createdAt).toLocaleString()}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const Notification = NotificationsPage;
export default NotificationsPage;
