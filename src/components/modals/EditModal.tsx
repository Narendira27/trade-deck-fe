import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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

  const { trades, setTrades } = useStore();

  const lastTradeId = useRef<string | null>(null);

  useEffect(() => {
    if (!tradeId || lastTradeId.current === tradeId) return;

    const trade = trades.find((trade) => trade.id === tradeId);

    if (trade) {
      setFormData((prev) => ({
        ...prev,
        pointOfAdjustment: trade.pointOfAdjustment,
        pointOfAdjustmentUpperLimit: trade.pointOfAdjustmentUpperLimit,
        pointOfAdjustmentLowerLimit: trade.pointOfAdjustmentLowerLimit,
        entryPrice: trade.entryPrice,
        takeProfitPremium: trade.takeProfitPremium,
        takeProfitPoints: trade.takeProfitPoints,
        stopLossPoints: trade.stopLossPoints,
        stopLossPremium: trade.stopLossPremium,
      }));

      lastTradeId.current = tradeId; // Update ref so it doesn't repeat
    }
  }, [isOpen, tradeId, trades]);

  useEffect(() => {
    const trade = trades.find((trade) => trade.id === tradeId);
    if (trade) {
      setOrderTriggered(trade.entryTriggered);
    }
  }, [tradeId, trades]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  useEffect(() => {
    if (!isOpen) {
      lastTradeId.current = null; // reset on modal close
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-400  rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Edit Order</h3>
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
                  entryPrice: parseFloat(e.target.value),
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stopLossPoints: parseFloat(e.target.value),
                      stopLossPremium:
                        parseFloat(e.target.value) + formData.entryPrice,
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stopLossPremium: parseFloat(e.target.value),
                      stopLossPoints:
                        parseFloat(e.target.value) - formData.entryPrice,
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      takeProfitPoints: parseFloat(e.target.value),
                      takeProfitPremium:
                        formData.entryPrice - parseFloat(e.target.value),
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      takeProfitPremium: parseFloat(e.target.value),
                      takeProfitPoints:
                        formData.entryPrice - parseFloat(e.target.value),
                    })
                  }
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
                  pointOfAdjustment: parseInt(e.target.value),
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
                  pointOfAdjustmentUpperLimit: parseFloat(e.target.value),
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
                  pointOfAdjustmentLowerLimit: parseFloat(e.target.value),
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
