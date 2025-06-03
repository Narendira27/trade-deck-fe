import { useCallback, useEffect } from "react";
import cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import SideNav from "../components/SideNav";
import TradeTable from "../components/TradeTable";
import DraggableBoxManager from "../components/DraggableBoxManager";
import { jwtDecode } from "jwt-decode";

import { API_URL } from "../config/config";

import { toast } from "sonner";
import useStore from "../store/store";
import DraggableBox from "../components/DraggableBox";

interface MyJwtPayload {
  updatePassword: boolean;
}

function Dashboard() {
  const {
    trades,
    draggableData,
    setTrades,
    updateHideStatus,
    removeDraggableData,
  } = useStore();

  const navigate = useNavigate();

  const getTradeData = useCallback(() => {
    const auth = cookies.get("auth");
    const verifyToken = axios.get(API_URL + "/user/tradeInfo", {
      headers: { Authorization: "Bearer " + auth },
    });

    toast.promise(verifyToken, {
      loading: "Checking session & fetching latest trades...",
      success: (data) => {
        setTrades(data.data.data);
        return "Trades updated successfully!";
      },
      error: () => {
        navigate("/login");
        return "Session expired / Server Down . Please log in again.";
      },
    });
  }, [navigate, setTrades]);

  useEffect(() => {
    const auth = cookies.get("auth");

    if (auth) {
      try {
        const decoded = jwtDecode<MyJwtPayload>(auth);
        if (decoded.updatePassword === true) {
          navigate("/onboarding");
          return;
        }
      } catch {
        navigate("/login");
      }
    }

    getTradeData();
  }, [navigate, getTradeData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const auth = cookies.get("auth");
      axios
        .get(API_URL + "/user/tradeInfo", {
          headers: { Authorization: "Bearer " + auth },
        })
        .then((data) => {
          setTrades(data.data.data);
        })
        .catch(() => {
          toast.error("Cannot update the Trade Data, Refresh the page");
        });
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [getTradeData, setTrades]);

  const removeBox = (id: string) => {
    removeDraggableData(id);
  };

  const hideBox = (id: string) => {
    updateHideStatus(id, true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main className="flex-1 overflow-hidden relative">
          <TradeTable trades={trades} />
          <DraggableBoxManager />
          {draggableData.map((each) => (
            <DraggableBox
              key={each.id}
              data={each}
              removeBox={() => removeBox(each.id)}
              hideBox={() => hideBox(each.id)}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
// {
//   id: "1",
//   index: "nifty",
//   ltpSpot: 24423,
//   legCount: 2,
//   expiry: "8-may",
//   ltpRange: 100,
//   lowestValue: 364,
//   entry: 370,
//   qty: 150,
//   exitPercentages: {
//     twentyFive: false,
//     fifty: false,
//     hundred: false,
//   },
//   trailing: false,
//   sl: 390,
//   target: 350,
//   entrySpotPrice: 24480,
//   mtm: 2500,
//   livePosition: "Long",
//   pointOfAdjustment: 50,
//   adjustmentPrice1: 24430,
//   adjustmentPrice2: 24530,
//   orderType: "LIMIT",
//   isActive: true,
// },
