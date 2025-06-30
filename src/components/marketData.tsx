import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import cookies from "js-cookie";
import { toast } from "sonner";
import useStore from "../store/store";
import { SOCKET_FE } from "../config/config";
import { getLowestCombinedPremiumArray } from "../utils/getlowestValue";

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

interface optionSubscribeArr {
  id: string;
  index: string;
  expiry: string;
  ltpRange: string;
}
interface CombinedPremiumItem {
  name: string;
  combinedPremium: number;
}

interface SpreadPremiumItem {
  name: string;
  spreadPremium: number;
}

interface PremiumData {
  id: number;
  combinedPremiumArray: CombinedPremiumItem[];
  spreadPremiumArray: SpreadPremiumItem[];
}

const MarketDataComponent = () => {
  const { draggableData, setIndexPrice, updateLowestValue } = useStore();

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  const optionSubscribedArrRef = useRef<optionSubscribeArr[]>([]);

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

  const subscribeToOptionInfo = (data: {
    id: string;
    index: string;
    expiry: string;
    ltpRange: string;
  }) => {
    if (!socketRef.current || !isConnected) {
      toast.error("Socket not connected");
      return;
    }

    socketRef.current.emit("subscribe-options-data", {
      data: {
        id: data.id,
        indexName: data.index,
        expiry: data.expiry,
        ltpRange: parseInt(data.ltpRange),
      },
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

    const checkHealthAndConnect = async () => {
      try {
        const res = await fetch(`${SOCKET_FE}/health`);
        if (!res.ok) throw new Error("Health check failed");

        const health = await res.json();

        if (health.brokerWSConnected && health.redisConnected) {
          socketRef.current = io(SOCKET_FE, {
            auth: {
              token: `Bearer ${token}`,
            },
            transports: ["websocket"],
          });

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

          socketRef.current.on("optionPremium", (data: PremiumData[]) => {
            const result = getLowestCombinedPremiumArray(data);
            if (result.length < 0) return;
            result.map((each) => {
              updateLowestValue(String(each.id), String(each.lowestValue));
            });
          });

          socketRef.current.on("priceUpdate", (data: PriceUpdate) => {
            const getName = indexName[data.id];
            data.name = getName;
            setIndexPrice(data);
          });

          socketRef.current.on("subscribed", (subs: string[]) => {
            toast.info("Subscribed to: " + subs.join(", "));
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
  }, [setIndexPrice, updateLowestValue]);

  // Auto-subscribe once connected
  useEffect(() => {
    if (isConnected) {
      subscribeToInstruments(instrumentsToSubscribe);
    }
  }, [isConnected]);

  useEffect(() => {
    if (draggableData.length > 0) {
      if (!isConnected) return;

      console.log(draggableData);

      const notSubscribedArr = draggableData.filter((data) => {
        return !optionSubscribedArrRef.current.some(
          (each) => each.id === data.id
        );
      });

      console.log("Not yet subscribed:", notSubscribedArr);

      if (notSubscribedArr.length > 0) {
        notSubscribedArr.forEach((data) => {
          subscribeToOptionInfo(data);
          optionSubscribedArrRef.current.push(data); // Track as subscribed
        });
      }
    }
  }, [draggableData, isConnected]);

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
