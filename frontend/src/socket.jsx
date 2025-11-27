import { createContext, useContext, useMemo } from "react";
import io from "socket.io-client";
// import { server } from "./constants/config";
// import { useEffect } from "react";

const SocketContext = createContext();

const useSocket = () => useContext(SocketContext);

const SocketProvider = ({ children }) => {
  const socket = useMemo(() => {
    const instance = io(`${import.meta.env.VITE_SERVER}`, {
      withCredentials: true,
    });
    instance.on("connect", () => {
      console.log("Socket connected:", instance.id);
    });
    instance.on("disconnect", () => {
      console.log("Socket disconnected");
    });
    return instance;
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
