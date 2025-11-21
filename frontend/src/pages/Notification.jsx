import { useEffect, useState } from "react";
import { useSocket } from "../socket";
import { useGetNotificationsQuery } from "../redux/api/api";

export const Notification = () => {
  const socket = useSocket();
  const { data, isLoading } = useGetNotificationsQuery();
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    socket.on("warning", (notif) => {
      setLiveNotifications((prev) => [notif, ...prev]);
    });
    return () => socket.off("warning");
  }, [socket]);

  useEffect(() => {
    console.log("data-->", data);
  }, [data]);

  if (isLoading) return <div>Loading notifications...</div>;

  const allNotifications = [...liveNotifications, ...data.notifications];

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Notifications</h2>

      {allNotifications?.length === 0 && (
        <p style={styles.empty}>No notifications found</p>
      )}

      {allNotifications.map((n) => (
        <div key={n._id || n.createdAt} style={styles.card}>
          <p style={styles.message}>{n.message}</p>
          <span style={styles.time}>
            {new Date(n.createdAt).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    maxWidth: "500px",
    margin: "20px auto",
    padding: "10px",
  },
  heading: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  empty: {
    opacity: 0.6,
    textAlign: "center",
  },
  card: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    marginBottom: "8px",
    background: "gray",
  },
  message: {
    margin: 0,
    fontSize: "0.95rem",
  },
  time: {
    fontSize: "0.75rem",
    opacity: 0.7,
  },
};
