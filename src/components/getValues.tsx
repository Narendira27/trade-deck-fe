import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore from "../store/store";
import { SOCKET_MAIN } from "../config/config";

const GetValues = () => {
  const { setOptionValues } = useStore();

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = cookies.get("auth");
    if (!token) {
      toast.error("Session not found");
      return;
    }

    const checkHealthAndConnect = async () => {
      try {
        const res = await fetch(`${SOCKET_MAIN}/health`);
        if (!res.ok) throw new Error("Health check failed");

        const health = await res.json();

        if (health.brokerWSConnected && health.redisConnected) {
          // Proceed to connect to Socket.IO
          socketRef.current = io(SOCKET_MAIN, {
            auth: {
              token: `Bearer ${token}`,
            },
            transports: ["websocket"],
          });

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
        } else {
          toast.error("Socket server not ready: Broker or Redis disconnected");
        }
      } catch (err) {
        toast.error("Health check failed: " + err);
      }
    };

    checkHealthAndConnect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [setOptionValues]);

  return <></>;
};

export default GetValues;
