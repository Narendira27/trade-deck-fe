import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
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
    orderType: "LIMIT",
  });

  const { trades, setTrades } = useStore();

  useEffect(() => {
    if (!tradeId) return;
    const trade = trades.find((trade) => trade.id === tradeId);

    if (trade) {
      setFormData((prev) => ({
        ...prev,
        sl: trade.stopLossPremium,
        target: trade.takeProfitPremium,
      }));
    }
  }, [tradeId]);

  const updateTp = () => {
    const auth = cookies.get("auth");
    const reqPromise = axios.put(
      API_URL + "/user/tradeInfo?id=" + tradeId,
      { stopLossPremium: formData.sl, takeProfitPremium: formData.target },
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
    const auth = cookies.get("auth");
    const reqPromise = axios.put(
      API_URL + "/user/tradeInfo?id=" + tradeId,
      {
        stopLossPremium: formData.sl,
        takeProfitPremium: formData.target,
        entryType: formData.orderType,
        entryPrice: formData.entry,
        qty: formData.qty,
        currentQty: formData.qty,
      },
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
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-400  rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Place Order</h3>
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

          {formData.orderType === "LIMIT" && (
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
                    entry: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.qty}
              onChange={(e) =>
                setFormData({ ...formData, qty: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Stop Loss
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.sl}
              onChange={(e) =>
                setFormData({ ...formData, sl: parseFloat(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Target
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.target}
              onChange={(e) =>
                setFormData({ ...formData, target: parseFloat(e.target.value) })
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
