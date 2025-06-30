import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore from "../store/store";
import { SOCKET_MAIN } from "../config/config";

const GetValues = () => {
  const { setOptionValues } = useStore();
  const socketRef = useRef<Socket | null>(null);

  // Memoize the callback to prevent recreation on every render
  const handleOptionPremium = useCallback((data: any) => {
    setOptionValues(data.data);
  }, [setOptionValues]);

  const handleLastPrice = useCallback((data: any) => {
    setOptionValues(data.optionsData);
  }, [setOptionValues]);

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

          socketRef.current.on("optionPremium", handleOptionPremium);
          socketRef.current.on("lastPrice", handleLastPrice);
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
        socketRef.current.off("optionPremium", handleOptionPremium);
        socketRef.current.off("lastPrice", handleLastPrice);
        socketRef.current.disconnect();
      }
    };
  }, [handleOptionPremium, handleLastPrice]);

  return <></>;
};

export default GetValues;