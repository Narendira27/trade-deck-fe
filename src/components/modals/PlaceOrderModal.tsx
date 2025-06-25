import React, { useEffect, useRef, useState } from "react";
import { X, GripHorizontal } from "lucide-react";
import { type OrderFormData } from "../../types/trade";
import cookies from "js-cookie";
import { API_URL } from "../../config/config";
import axios from "axios";
import { toast } from "sonner";
import useStore from "../../store/store";
import getTradeData from "../../utils/getTradeData";

interface PlaceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string | null;
}

interface DataType {
  stopLossPremium?: number;
  takeProfitPremium?: number;
  stopLossPoints?: number;
  takeProfitPoints?: number;
  entryType: "MARKET" | "LIMIT";
  entryPrice: number;
  qty: number;
  currentQty: number;
}

const PlaceOrderModal: React.FC<PlaceOrderModalProps> = ({
  isOpen,
  onClose,
  tradeId,
}) => {
  const [formData, setFormData] = useState<OrderFormData>({
    entry: 0,
    qty: 0,
    sl: 0,
    target: 0,
    slPoints: 0,
    tpPoints: 0,
    orderType: "LIMIT",
  });

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const { trades, setTrades, optionLotSize } = useStore();
  const isInitialized = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const getTradeInfo = () => {
    if (trades.length > 0 && trades && tradeId) {
      const filterInTrade = trades.filter((each) => each.id === tradeId);
      if (filterInTrade.length > 0) return filterInTrade[0];
      throw new Error("Trade Not Found");
    }
  };

  const getLotSizeInfo = () => {
    const infoObj = getTradeInfo();
    if (infoObj) {
      const lotData = optionLotSize.find(
        (each) =>
          each.optionName ===
          `${infoObj?.indexName.toLowerCase()}${infoObj?.expiry}`
      );
      return lotData?.lotSize;
    }
  };

  // Initialize form data when modal opens with a trade
  useEffect(() => {
    if (isOpen && tradeId && !isInitialized.current) {
      const trade = trades.find((trade) => trade.id === tradeId);

      if (trade) {
        setFormData({
          entry: trade.entryPrice || 0,
          qty: trade.qty || 0,
          sl: trade.stopLossPremium || 0,
          target: trade.takeProfitPremium || 0,
          tpPoints: trade.takeProfitPoints || 0,
          slPoints: trade.stopLossPoints || 0,
          orderType: "LIMIT",
        });
        isInitialized.current = true;
      }
    }
  }, [isOpen, tradeId, trades]);

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      isInitialized.current = false;
    }
  }, [isOpen]);

  const updateTp = () => {
    let data;
    if (formData.orderType === "LIMIT") {
      data = {
        stopLossPremium: formData.sl,
        takeProfitPremium: formData.target,
      };
    }
    if (formData.orderType === "MARKET") {
      data = {
        stopLossPoints: formData.slPoints,
        takeProfitPoints: formData.tpPoints,
      };
    }
    const auth = cookies.get("auth");
    const reqPromise = axios.put(
      API_URL + "/user/tradeInfo?id=" + tradeId,
      data,
      {
        headers: { Authorization: "Bearer " + auth },
      }
    );
    toast.promise(reqPromise, {
      loading: "Updating TP & SL ...",
      success: async () => {
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        onClose();
        return "Updated SL and TP";
      },
      error: "Cannot update SL & TP",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entry && formData.orderType === "LIMIT") {
      return toast.warning("entry price is required");
    }

    if (!formData.qty) {
      return toast.warning("qty is required");
    }

    console.log(formData.orderType);
    if (formData.orderType.length < 0) {
      return toast.warning("order type is required");
    }

    if (formData.sl === 0 && formData.slPoints === 0) {
      return toast.warning("sl is required");
    }

    if (formData.target === 0 && formData.tpPoints === 0) {
      return toast.warning("tp is required");
    }

    const DATA: DataType = {
      entryType: formData.orderType,
      entryPrice: formData.entry,
      qty: formData.qty,
      currentQty: formData.qty,
    };

    if (formData.orderType === "LIMIT") {
      DATA.stopLossPremium = formData.sl;
      DATA.takeProfitPremium = formData.target;
      DATA.stopLossPoints = formData.sl - formData.entry;
      DATA.takeProfitPoints = formData.entry - formData.target;
    }

    if (formData.orderType === "MARKET") {
      if (formData.slPoints) DATA.stopLossPoints = formData.slPoints;
      if (formData.tpPoints) DATA.takeProfitPoints = formData.tpPoints;
    }

    const auth = cookies.get("auth");
    const reqPromise = axios.put(
      API_URL + "/user/tradeInfo?id=" + tradeId,
      DATA,
      {
        headers: { Authorization: "Bearer " + auth },
      }
    );
    toast.promise(reqPromise, {
      loading: "Placing Order ... ",
      success: async () => {
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        onClose();
        return "Order Placed Successfully";
      },
      error: "Cannot Place Order",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-6 w-full max-w-md cursor-move select-none ${
          isDragging ? "opacity-90" : ""
        }`}
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div
            className="flex items-center space-x-2 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal size={16} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Place Order</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center space-x-4 mb-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-500"
                name="orderType"
                value="LIMIT"
                checked={formData.orderType === "LIMIT"}
                onChange={() =>
                  setFormData({ ...formData, orderType: "LIMIT" })
                }
              />
              <span className="ml-2 text-white">Limit</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-500"
                name="orderType"
                value="MARKET"
                checked={formData.orderType === "MARKET"}
                onChange={() =>
                  setFormData({ ...formData, orderType: "MARKET" })
                }
              />
              <span className="ml-2 text-white">Market</span>
            </label>
          </div>

          {formData.orderType === "LIMIT" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.entry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      entry: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Lots (qty : {getLotSizeInfo()})
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.qty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      qty: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Stop Loss (PREMIUM)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sl: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Target (PREMIUM)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.target}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Lots (qty : {getLotSizeInfo()})
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.qty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      qty: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Stop Loss (POINTS)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.slPoints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slPoints: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Target (POINTS)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.tpPoints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tpPoints: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={updateTp}
              type="button"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Set TP & SL
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Place Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrderModal;
