import React, { useEffect, useState } from "react";
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
  });

  const { trades, setTrades } = useStore();

  useEffect(() => {
    if (!tradeId) return;
    const trade = trades.find((trade) => trade.id === tradeId);

    if (trade) {
      setFormData((prev) => ({
        ...prev,
        pointOfAdjustment: trade.pointOfAdjustment,
        pointOfAdjustmentUpperLimit: trade.pointOfAdjustmentUpperLimit,
        pointOfAdjustmentLowerLimit: trade.pointOfAdjustmentLowerLimit,
      }));
    }
  }, [tradeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const auth = cookies.get("auth");
    const reqPromise = axios.put(
      API_URL + "/user/tradeInfo?id=" + tradeId,
      {
        pointOfAdjustment: formData.pointOfAdjustment,
        pointOfAdjustmentUpperLimit: formData.pointOfAdjustmentUpperLimit,
        pointOfAdjustmentLowerLimit: formData.pointOfAdjustmentLowerLimit,
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
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Edit Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
