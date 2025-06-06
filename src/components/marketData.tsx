import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";

// Define types for the price update data
interface PriceUpdate {
  segment: number;
  id: number;
  price: number;
}

// Define types for instrument subscription
interface Instrument {
  exchangeSegment: number;
  exchangeInstrumentID: number;
}

const MarketDataComponent = () => {
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = cookies.get("auth");
    if (!token) {
      toast.error("Session not found");
      return;
    }

    socketRef.current = io("http://localhost:3000", {
      auth: {
        token: token,
      },
      transports: ["websocket"],
    });

    if (!socketRef.current) return;

    // Connection events
    socketRef.current.on("connect", () => {
      setIsConnected(true);
      toast.info("Connected to Socket.IO server");
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      toast.info("Disconnected from Socket.IO server");
    });

    socketRef.current.on("error", (err: Error) => {
      toast.error("Socket error: " + err);
    });

    // Handle price updates
    socketRef.current.on("priceUpdate", (data: PriceUpdate) => {
      setPriceUpdates((prev) => [...prev, data]);
      //   console.log("Price update:", data);
    });

    // Handle subscription confirmations
    socketRef.current.on("subscribed", (subs: string[]) => {
      setSubscriptions(subs);
      toast.info("Subscribed to: " + subs);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Subscribe to instruments
  const subscribeToInstruments = (instruments: Instrument[]) => {
    if (!socketRef.current || !isConnected) {
      toast.error("Socket not connected");
      return;
    }

    socketRef.current.emit("subscribe", {
      instruments: instruments.map((instrument) => ({
        exchangeSegment: instrument.exchangeSegment,
        exchangeInstrumentID: instrument.exchangeInstrumentID,
      })),
    });
  };

  // Example usage
  const handleSubscribe = () => {
    subscribeToInstruments([
      { exchangeSegment: 1, exchangeInstrumentID: 1234 }, // NSE | INFY
      { exchangeSegment: 1, exchangeInstrumentID: 1235 }, // NSE | RELIANCE
    ]);
  };
};

export default MarketDataComponent;
