import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore from "../store/store";

// Define types
interface PriceUpdate {
  name: string;
  segment: number;
  id: number;
  price: number;
}

interface Instrument {
  exchangeSegment: number;
  exchangeInstrumentID: number;
}

const MarketDataComponent = () => {
  const { setIndexPrice } = useStore();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  // const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Function to subscribe to instruments
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

  // List of instruments to subscribe to
  const instrumentsToSubscribe: Instrument[] = [
    { exchangeSegment: 1, exchangeInstrumentID: 26000 }, // NIF
    { exchangeSegment: 1, exchangeInstrumentID: 26001 }, // BANK
    { exchangeSegment: 1, exchangeInstrumentID: 26034 }, // FIN
    { exchangeSegment: 1, exchangeInstrumentID: 26005 }, // MIDCAP NIFTY
    { exchangeSegment: 11, exchangeInstrumentID: 26065 },
    { exchangeSegment: 11, exchangeInstrumentID: 26118 },
  ];

  // Establish socket connection
  useEffect(() => {
    const token = cookies.get("auth");
    if (!token) {
      toast.error("Session not found");
      return;
    }

    socketRef.current = io("http://localhost:3002", {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket"],
    });

    if (!socketRef.current) return;

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      toast.info("Connected to Socket.IO server");
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      toast.info("Disconnected from Socket.IO server");
    });

    socketRef.current.on("error", (err: Error) => {
      toast.error("Socket error: " + err.message);
    });

    socketRef.current.on("priceUpdate", (data: PriceUpdate) => {
      const getName = indexName[data.id];
      data.name = getName;
      setIndexPrice(data);
    });

    socketRef.current.on("subscribed", (subs: string[]) => {
      // setSubscriptions(subs);

      toast.info("Subscribed to: " + subs.join(", "));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Auto-subscribe once connected
  useEffect(() => {
    if (isConnected) {
      subscribeToInstruments(instrumentsToSubscribe);
    }
  }, [isConnected]);

  return <></>;
};

export default MarketDataComponent;

const indexName: Record<number, string> = {
  26000: "NIFTY",
  26001: "BANKNIFTY",
  26034: "FINNIFTY",
  26005: "MIDCPNIFTY",
  26065: "SENSEX",
  26118: "BANKEX",
};
