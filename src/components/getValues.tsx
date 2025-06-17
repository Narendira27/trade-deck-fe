import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore from "../store/store";
import { SOCKET_MAIN } from "../config/config";

const GetValues = () => {
  const { setOptionValues } = useStore();

  const socketRef = useRef<Socket | null>(null);

  // Establish socket connection
  useEffect(() => {
    const token = cookies.get("auth");
    if (!token) {
      toast.error("Session not found");
      return;
    }

    socketRef.current = io(SOCKET_MAIN, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket"],
    });

    if (!socketRef.current) return;

    socketRef.current.on("connect", () => {
      toast.info("Connected to Socket.IO server");
    });

    socketRef.current.on("disconnect", () => {
      toast.info("Disconnected from Socket.IO server");
    });

    socketRef.current.on("error", (err: Error) => {
      toast.error("Socket error: " + err.message);
    });

    socketRef.current.on("optionPremium", (data) => {
      setOptionValues(data.data);
    });

    socketRef.current.on("lastPrice", (data) => {
      setOptionValues(data.optionsData);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return <></>;
};

export default GetValues;
