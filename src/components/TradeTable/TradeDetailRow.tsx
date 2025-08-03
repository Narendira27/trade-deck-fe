import React, { useState } from "react";
import { Edit, Trash2, Check, X } from "lucide-react";
import { type TradeDetail } from "../../types/trade";
import { type TradeDetailColumn } from "../../types/instanceColumns";
import { formatNumber, formatCurrency } from "../../utils/formatters";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import useStore from "../../store/store";

interface TradeDetailRowProps {
  tradeDetail: TradeDetail;
  instanceId: string;
  visibleColumns: TradeDetailColumn[];
}

const TradeDetailRow: React.FC<TradeDetailRowProps> = ({
  tradeDetail,
  instanceId,
  visibleColumns,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(tradeDetail);
  const { setInstances, optionLotSize } = useStore();

  const handleSave = async () => {
    const auth = cookies.get("auth");
    const {
      qty,
      entrySide,
      entryType,
      entryPrice,
      stopLossPoints,
      stopLossPremium,
      takeProfitPoints,
      takeProfitPremium,
      pointOfAdjustment,
      pointOfAdjustmentLowerLimit,
      pointOfAdjustmentUpperLimit,
    } = editData;

    const putData = {
      qty,
      entrySide,
      entryType,
      entryPrice,
      stopLossPoints,
      stopLossPremium,
      takeProfitPoints,
      takeProfitPremium,
      pointOfAdjustment,
      pointOfAdjustmentLowerLimit,
      pointOfAdjustmentUpperLimit,
    };

    try {
      const url = `${API_URL}/user/tradeInfo?id=${tradeDetail.id}`;

      await axios.put(url, putData, {
        headers: { Authorization: `Bearer ${auth}` },
      });
      toast.success("Trade detail updated successfully");

      setIsEditing(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to save trade detail");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(tradeDetail);
  };

  const handleDelete = async () => {
    const auth = cookies.get("auth");

    toast.warning("Are you sure you want to delete this trade detail?", {
      action: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            await axios.delete(
              `${API_URL}/user/tradeInfo?id=${tradeDetail.id}`,
              {
                headers: { Authorization: `Bearer ${auth}` },
              }
            );
            toast.success("Trade detail deleted successfully");
          } catch (error) {
            console.log(error);
            toast.error("Failed to delete trade detail");
          }
        },
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getBooleanDisplay = (value: boolean) => (value ? "Yes" : "No");

  const getBooleanColor = (value: boolean) =>
    value ? "text-green-400" : "text-red-400";

  const getExitPercentages = () => {
    const qty = tradeDetail.currentQty;
    if (qty <= 0) return [];
    const percentages = [];

    if (qty === 1) percentages.push(100);
    else if (qty === 2) percentages.push(50, 100);
    else if (qty === 3) percentages.push(33, 67, 100);
    else if (qty === 4) percentages.push(25, 50, 75, 100);
    else if (qty === 5) percentages.push(20, 40, 60, 80, 100);
    else if (qty >= 10)
      percentages.push(10, 20, 30, 40, 50, 60, 70, 80, 90, 100);
    else {
      for (let i = 1; i <= qty; i++) {
        const percentage = Math.round((i / qty) * 100);
        if (!percentages.includes(percentage)) percentages.push(percentage);
      }
    }

    return percentages.sort((a, b) => a - b);
  };

  const getLotSize = () => {
    const lotData = optionLotSize.find((lot) =>
      lot.optionName.toLowerCase().includes("nifty")
    );
    return lotData?.lotSize || 1;
  };

  const getCellValue = (columnId: string) => {
    if (isEditing) {
      switch (columnId) {
        case "currentQty":
          return tradeDetail.currentQty;
        case "humanId":
          return tradeDetail.humanId;
        case "legCount":
          return tradeDetail.legCount;

        case "qty":
          return (
            <div className="flex flex-col">
              <span className="text-xs mb-1 text-gray-400">
                Lot: {getLotSize()}
              </span>
              <input
                type="number"
                value={Math.floor(editData.qty)}
                onChange={(e) => {
                  const lots = parseInt(e.target.value) || 0;
                  setEditData({ ...editData, qty: lots });
                }}
                className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          );
        case "entrySide":
          return (
            <select
              value={editData.entrySide}
              onChange={(e) =>
                setEditData({ ...editData, entrySide: e.target.value })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="UNDEFINED">UNDEFINED</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          );
        case "entryType":
          return (
            <select
              value={editData[columnId]}
              onChange={(e) =>
                setEditData({ ...editData, [columnId]: e.target.value })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            >
              <>
                <option value="UNDEFINED">UNDEFINED</option>
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
              </>
            </select>
          );
        case "entryPrice":
          return editData.entryType === "LIMIT" ||
            editData.entryType === "UNDEFINED" ? (
            <input
              type="number"
              step="1"
              value={editData.entryPrice}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  entryPrice: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          ) : (
            <span className="text-xs text-gray-400">Market</span>
          );
        case "stopLossPoints":
          return (
            <input
              type="number"
              step="1"
              value={editData.stopLossPoints}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  stopLossPoints: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "stopLossPremium":
          return (
            <input
              type="number"
              step="1"
              value={editData.stopLossPremium}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  stopLossPremium: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "takeProfitPoints":
          return (
            <input
              type="number"
              step="1"
              value={editData.takeProfitPoints}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  takeProfitPoints: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "takeProfitPremium":
          return (
            <input
              type="number"
              step="1"
              value={editData.takeProfitPremium}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  takeProfitPremium: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "pointOfAdjustment":
          return (
            <input
              type="number"
              step="1"
              value={editData.pointOfAdjustment}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  pointOfAdjustment: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "pointOfAdjustmentLowerLimit":
          return (
            <input
              type="number"
              step="1"
              value={editData.pointOfAdjustmentLowerLimit}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  pointOfAdjustmentLowerLimit: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "pointOfAdjustmentUpperLimit":
          return (
            <input
              type="number"
              step="1"
              value={editData[columnId]}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  [columnId]: parseFloat(e.target.value) || 0,
                })
              }
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "entrySpotPrice":
          return formatNumber(tradeDetail.entrySpotPrice);
        case "entryTriggered":
          return getBooleanDisplay(tradeDetail.entryTriggered);
        case "slTriggered":
          return getBooleanDisplay(tradeDetail.slTriggered);
        case "tpTriggered":
          return getBooleanDisplay(tradeDetail[columnId]);
        case "reason":
          return tradeDetail.reason || "-";
        case "userExit":
          return (
            <div className="flex flex-wrap gap-1">
              {getExitPercentages().map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleUserExit(percentage)}
                  className="px-1 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  {percentage}%
                </button>
              ))}
            </div>
          );
        case "mtm":
          return formatCurrency(tradeDetail.mtm);
        case "updatedAt":
          return formatDate(tradeDetail.updatedAt);
        default:
          return "-";
      }
    }

    switch (columnId) {
      case "humanId":
        return tradeDetail.humanId;
      case "legCount":
        return tradeDetail.legCount;
      case "qty":
        return tradeDetail.qty;
      case "currentQty":
        return tradeDetail.currentQty;
      case "entrySide":
        return tradeDetail.entrySide;
      case "entryType":
        return tradeDetail[columnId];
      case "entryPrice":
        return formatNumber(tradeDetail.entryPrice);
      case "entrySpotPrice":
        return formatNumber(tradeDetail.entrySpotPrice);
      case "stopLossPoints":
        return formatNumber(tradeDetail.stopLossPoints);
      case "stopLossPremium":
        return formatNumber(tradeDetail.stopLossPremium);
      case "takeProfitPoints":
        return formatNumber(tradeDetail.takeProfitPoints);
      case "takeProfitPremium":
        return formatNumber(tradeDetail.takeProfitPremium);
      case "pointOfAdjustment":
        return formatNumber(tradeDetail.pointOfAdjustment);
      case "pointOfAdjustmentLowerLimit":
        return formatNumber(tradeDetail.pointOfAdjustmentLowerLimit);
      case "pointOfAdjustmentUpperLimit":
        return formatNumber(tradeDetail[columnId]);
      case "entryTriggered":
        return getBooleanDisplay(tradeDetail.entryTriggered);
      case "slTriggered":
        return getBooleanDisplay(tradeDetail.slTriggered);
      case "tpTriggered":
        return getBooleanDisplay(tradeDetail[columnId]);
      case "reason":
        return tradeDetail.reason || "-";
      case "userExit":
        return (
          <div className="flex flex-wrap gap-1">
            {getExitPercentages().map((percentage) => (
              <button
                key={percentage}
                onClick={() => handleUserExit(percentage)}
                className="px-1 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                {percentage}%
              </button>
            ))}
          </div>
        );
      case "mtm":
        return formatCurrency(tradeDetail.mtm);
      case "updatedAt":
        return formatDate(tradeDetail.updatedAt);
      default:
        return "-";
    }
  };

  const handleUserExit = (percentage: number) => {
    toast.warning(`Exit ${percentage}% of position?`, {
      action: {
        label: "Yes, Exit",
        onClick: async () => {
          const auth = cookies.get("auth");
          try {
            await axios.post(
              `${API_URL}/user/instances/${instanceId}/trades/${tradeDetail.id}/exit`,
              { percentage },
              {
                headers: { Authorization: `Bearer ${auth}` },
              }
            );

            const response = await axios.get(`${API_URL}/user/instances`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            setInstances(response.data.data);

            toast.success(`${percentage}% position exited successfully`);
          } catch (error) {
            console.log(error);
            toast.error("Failed to exit position");
          }
        },
      },
    });
  };

  const getCellClassName = (columnId: string) => {
    const baseClass = "px-2 py-1 text-xs";
    switch (columnId) {
      case "stopLossPoints":
      case "stopLossPremium":
        return `${baseClass} text-red-400`;
      case "takeProfitPoints":
      case "takeProfitPremium":
        return `${baseClass} text-green-400`;
      case "mtm":
        return `${baseClass} ${
          tradeDetail.mtm >= 0 ? "text-green-400" : "text-red-400"
        }`;
      case "entryTriggered":
      case "slTriggered":
      case "tpTriggered":
        return `${baseClass} ${getBooleanColor(
          tradeDetail[columnId as keyof TradeDetail] as boolean
        )}`;
      default:
        return `${baseClass} text-white`;
    }
  };

  return (
    <tr className="hover:bg-gray-600/30 transition-colors">
      {visibleColumns.map((column) => (
        <td key={column.id} className={getCellClassName(column.id)}>
          {getCellValue(column.id)}
        </td>
      ))}
      <td className="px-2 py-1">
        <div className="flex space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="Save or Place"
              >
                <Check size={10} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                title="Cancel"
              >
                <X size={10} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditData(tradeDetail);
                }}
                className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                title="Edit"
              >
                <Edit size={10} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 size={10} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TradeDetailRow;
