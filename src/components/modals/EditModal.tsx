import React, { useEffect, useRef, useState } from "react";
import { X, GripHorizontal } from "lucide-react";
import { type EditFormData } from "../../types/trade";
import cookies from "js-cookie";
import { API_URL } from "../../config/config";
import axios from "axios";
import { toast } from "sonner";
import useStore from "../../store/store";
import getTradeData from "../../utils/getTradeData";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string | null;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, tradeId }) => {
  const [formData, setFormData] = useState<EditFormData>({
    pointOfAdjustment: 0,
    pointOfAdjustmentUpperLimit: 0,
    pointOfAdjustmentLowerLimit: 0,
    entryPrice: 0,
    takeProfitPoints: 0,
    takeProfitPremium: 0,
    stopLossPoints: 0,
    stopLossPremium: 0,
  });

  const [orderTriggered, setOrderTriggered] = useState(true);
  const [enablePremium, setEnablePremium] = useState(false);
  const [enablePremiumTp, setEnablePremiumTP] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const { trades, setTrades } = useStore();
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

  // Initialize form data when modal opens with a trade
  useEffect(() => {
    if (isOpen && tradeId && !isInitialized.current) {
      const trade = trades.find((trade) => trade.id === tradeId);

      if (trade) {
        setFormData({
          pointOfAdjustment: trade.pointOfAdjustment || 0,
          pointOfAdjustmentUpperLimit: trade.pointOfAdjustmentUpperLimit || 0,
          pointOfAdjustmentLowerLimit: trade.pointOfAdjustmentLowerLimit || 0,
          entryPrice: trade.entryPrice || 0,
          takeProfitPremium: trade.takeProfitPremium || 0,
          takeProfitPoints: trade.takeProfitPoints || 0,
          stopLossPoints: trade.stopLossPoints || 0,
          stopLossPremium: trade.stopLossPremium || 0,
        });

        setOrderTriggered(trade.entryTriggered);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trades[0].entryType === "UNDEFINED") {
      return toast.error("Cannot Edit Trade Before placing order!");
    }

    const auth = cookies.get("auth");
    const reqPromise = axios.put(
      API_URL + "/user/tradeInfo?id=" + tradeId,
      {
        pointOfAdjustment: formData.pointOfAdjustment,
        pointOfAdjustmentUpperLimit: formData.pointOfAdjustmentUpperLimit,
        pointOfAdjustmentLowerLimit: formData.pointOfAdjustmentLowerLimit,
        entryPrice: formData.entryPrice,
        takeProfitPremium: formData.takeProfitPremium,
        takeProfitPoints: formData.takeProfitPoints,
        stopLossPoints: formData.stopLossPoints,
        stopLossPremium: formData.stopLossPremium,
      },
      {
        headers: { Authorization: "Bearer " + auth },
      }
    );
    toast.promise(reqPromise, {
      loading: "Updating Order ... ",
      success: async () => {
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        onClose();
        return "Updated Successfully";
      },
      error: "Cannot Update Order",
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
            <h3 className="text-lg font-semibold text-white">Edit Order</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Entry Price
            </label>
            <input
              disabled={orderTriggered}
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.entryPrice}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  entryPrice: parseFloat(e.target.value) || 0,
                  stopLossPremium:
                    parseFloat(e.target.value) + formData.stopLossPoints,
                  takeProfitPremium:
                    parseFloat(e.target.value) - formData.takeProfitPoints,
                })
              }
            />
          </div>

          <div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={enablePremium}
                onChange={() => setEnablePremium((prev) => !prev)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                Enable Premium
              </span>
            </label>
            <div className="flex gap-5">
              <div>
                <label className="flex gap-2 text-sm font-medium text-gray-300 mb-1">
                  Stop Loss (Points)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stopLossPoints}
                  onChange={(e) => {
                    const points = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      stopLossPoints: points,
                      stopLossPremium: points + formData.entryPrice,
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Stop Loss (Premium)
                </label>
                <input
                  type="number"
                  disabled={!enablePremium}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stopLossPremium}
                  onChange={(e) => {
                    const premium = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      stopLossPremium: premium,
                      stopLossPoints: premium - formData.entryPrice,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={enablePremiumTp}
                onChange={() => setEnablePremiumTP((prev) => !prev)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                Enable Premium
              </span>
            </label>
            <div className="flex gap-5">
              <div>
                <label className="flex gap-2 text-sm font-medium text-gray-300 mb-1">
                  Take Profit (Points)
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.takeProfitPoints}
                  onChange={(e) => {
                    const points = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      takeProfitPoints: points,
                      takeProfitPremium: formData.entryPrice - points,
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Take Profit (Premium)
                </label>
                <input
                  type="number"
                  disabled={!enablePremiumTp}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.takeProfitPremium}
                  onChange={(e) => {
                    const premium = parseFloat(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      takeProfitPremium: premium,
                      takeProfitPoints: formData.entryPrice - premium,
                    });
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Point of Adjustment
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pointOfAdjustment}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointOfAdjustment: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Point Of Adjustment Upper Limit
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pointOfAdjustmentUpperLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointOfAdjustmentUpperLimit: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Point Of Adjustment Lower Limit
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pointOfAdjustmentLowerLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointOfAdjustmentLowerLimit: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
