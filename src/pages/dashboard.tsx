import { useCallback, useEffect, useState } from "react";
import cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import Header from "../components/Header";
import SideNav from "../components/SideNav";
import TradeTable from "../components/TradeTable";
import { jwtDecode } from "jwt-decode";
import { type Column } from "../components/TradeTable/ColumnManager";
import MarketDataComponent from "../components/marketData";
import GetValues from "../components/getValues";
import ResizablePanel from "../components/ResizablePanel";
import ChartContainer from "../components/Chart/ChartContainer";
import PositionTracker from "../components/PositionTracker/PositionTracker";
import DraggableBoxManager from "../components/DraggableBoxManager";
import DraggableBox, { 
  defaultDraggableColumns,
  type DraggableBoxColumn 
} from "../components/DraggableBox";

import { API_URL } from "../config/config";
import useStore from "../store/store";

interface MyJwtPayload {
  updatePassword: boolean;
}

const defaultColumns: Column[] = [
  { id: "index", label: "Index", visible: true, width: "120px" },
  { id: "ltpSpot", label: "LTP Spot", visible: true, width: "100px" },
  { id: "legCount", label: "Leg Count", visible: true, width: "100px" },
  { id: "expiry", label: "Expiry", visible: true, width: "120px" },
  { id: "ltpRange", label: "LTP Range", visible: true, width: "100px" },
  { id: "lowestValue", label: "Lowest Value", visible: true, width: "120px" },
  { id: "entry", label: "Entry", visible: true, width: "100px" },
  { id: "qty", label: "Quantity", visible: true, width: "100px" },
  { id: "sl", label: "Stop Loss", visible: true, width: "100px" },
  { id: "target", label: "Target", visible: true, width: "100px" },
  {
    id: "entrySpot",
    label: "Entry Spot Price",
    visible: true,
    width: "140px",
  },
  { id: "mtm", label: "MTM", visible: true, width: "100px" },
  {
    id: "pointOfAdjustment",
    label: "Point of Adjustment",
    visible: true,
    width: "160px",
  },
  {
    id: "adjustmentUpperLimit",
    label: "Adjustment Upper Limit",
    visible: true,
    width: "180px",
  },
  {
    id: "adjustmentLowerLimit",
    label: "Adjustment Lower Limit",
    visible: true,
    width: "180px",
  },
  { id: "orderType", label: "Order Type", visible: true, width: "120px" },
  {
    id: "entryTriggered",
    label: "Entry Triggered",
    visible: true,
    width: "140px",
  },
  { id: "exitPercentages", label: "Exit %", visible: true, width: "150px" },
];

function Dashboard() {
  const { trades, setTrades } = useStore();
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [draggableColumns, setDraggableColumns] = useState<DraggableBoxColumn[]>(defaultDraggableColumns);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
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

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <Header
        columns={columns}
        onColumnsChange={setColumns}
        draggableColumns={draggableColumns}
        onDraggableColumnsChange={setDraggableColumns}
        onMenuToggle={() => setIsSideNavOpen(!isSideNavOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden relative">
          <ResizablePanel
            direction="vertical"
            initialSize={30}
            minSize={20}
            maxSize={50}
          >
            {/* Top section - Trade Table (30%) */}
            <div className="h-full bg-gray-900 border-b border-gray-700">
              <TradeTable trades={trades} columns={columns} />
            </div>

            {/* Bottom section - Chart and Position Tracker (70%) */}
            <ResizablePanel
              direction="horizontal"
              initialSize={65}
              minSize={40}
              maxSize={80}
            >
              {/* Chart section */}
              <div className="h-full p-2">
                <ChartContainer />
              </div>

              {/* Position Tracker section */}
              <div className="h-full p-2">
                <PositionTracker />
              </div>
            </ResizablePanel>
          </ResizablePanel>

          <DraggableBoxManager />
          <DraggableBox columns={draggableColumns} />

          <MarketDataComponent />
          <GetValues />
        </main>

        <SideNav
          isOpen={isSideNavOpen}
          onToggle={() => setIsSideNavOpen(!isSideNavOpen)}
        />
      </div>
    </div>
  );
}

export default Dashboard;