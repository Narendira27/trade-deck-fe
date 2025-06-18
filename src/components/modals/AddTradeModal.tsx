import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { type TradeFormData } from "../../types/trade";
import cookies from "js-cookie";
import { API_URL } from "../../config/config";
import axios from "axios";
import { toast } from "sonner";
import getTradeData from "../../utils/getTradeData";
import useStore from "../../store/store";

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<TradeFormData>({
    index: "",
    legCount: 1,
    expiry: "",
    ltpRange: 0,
    pointOfAdjustment: 0,
  });

  // const [indexData, setIndexData] = useState<indexData>({
  //   indices: [],
  //   expiry: {},
  // });

  const { setTrades, setIndexData, indexData } = useStore();
  useEffect(() => {
    const auth = cookies.get("auth");
    if (auth) {
      axios
        .get(API_URL + "/user/optionData", {
          headers: { Authorization: "Bearer " + auth },
        })
        .then((data) => {
          setIndexData(data.data.data);
        })
        .catch((err) => {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch option data";
          toast.error(errorMessage);
        });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const auth = cookies.get("auth");

    if (!formData.index.trim()) {
      return toast.warning("Select Index");
    }
    if (!formData.expiry.trim()) {
      return toast.warning("Select Expiry");
    }
    if (formData.legCount <= 0) {
      return toast.warning("Enter valid straddle count");
    }
    if (formData.ltpRange <= 0) {
      return toast.warning("Enter valid LTP Range");
    }
    if (formData.ltpRange <= 0) {
      return toast.warning("Enter valid Point of Adjustment");
    }
    const addTradeRequest = axios.post(
      API_URL + "/user/tradeInfo",
      {
        indexName: formData.index,
        expiry: formData.expiry,
        legCount: formData.legCount,
        ltpRange: formData.ltpRange,
        pointOfAdjustment: formData.pointOfAdjustment,
      },
      { headers: { Authorization: "Bearer " + auth } }
    );
    toast.promise(addTradeRequest, {
      loading: "Adding Trade Info ...",
      success: async () => {
        onClose();
        setFormData({
          index: "",
          legCount: 1,
          expiry: "",
          ltpRange: 0,
          pointOfAdjustment: 0,
        });
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        return "Trade Info Has been Successfully Added ...";
      },
      error: (res) => {
        onClose();
        const errorMessage =
          res.response?.data?.message || res.message || "Failed to add trade";
        return errorMessage;
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-400  rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Add New Trade</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Index
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.index}
              onChange={(e) =>
                setFormData({ ...formData, index: e.target.value })
              }
            >
              <option value="" disabled hidden>
                Select Index
              </option>
              {indexData.indices.length > 0
                ? indexData.indices.map((each) => (
                    <option key={each} value={each.toUpperCase()}>
                      {each.toUpperCase()}
                    </option>
                  ))
                : null}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Straddle Count
            </label>
            <input
              type="number"
              min="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.legCount}
              onChange={(e) =>
                setFormData({ ...formData, legCount: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expiry
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.expiry}
              onChange={(e) =>
                setFormData({ ...formData, expiry: e.target.value })
              }
            >
              <option value="" disabled hidden>
                Select Expiry
              </option>
              {indexData.expiry[formData.index.toLowerCase()]?.length > 0 &&
                indexData.expiry[formData.index.toLowerCase()].map((each) => (
                  <option key={each} value={each.toUpperCase()}>
                    {each.toUpperCase()}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              LTP Range
            </label>
            <input
              type="number"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.ltpRange}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ltpRange: parseFloat(e.target.value),
                })
              }
            />
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
                  pointOfAdjustment: parseFloat(e.target.value),
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
              Add Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTradeModal;
