import React, { useState } from "react";
import { Edit, Trash2, Play, Check, X } from "lucide-react";
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

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(tradeDetail);
  };

  const handleSave = async () => {
    const auth = cookies.get("auth");
    
    try {
      await axios.put(
        `${API_URL}/user/instances/${instanceId}/trades/${tradeDetail.id}`,
        editData,
        {
          headers: { Authorization: `Bearer ${auth}` },
        }
      );
      
      // Refresh instances data
      const response = await axios.get(`${API_URL}/user/instances`, {
        headers: { Authorization: `Bearer ${auth}` },
      });
      setInstances(response.data.data);
      
      setIsEditing(false);
      toast.success("Trade detail updated successfully");
    } catch (error) {
      toast.error("Failed to update trade detail");
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
              `${API_URL}/user/instances/${instanceId}/trades/${tradeDetail.id}`,
              {
                headers: { Authorization: `Bearer ${auth}` },
              }
            );
            
            // Refresh instances data
            const response = await axios.get(`${API_URL}/user/instances`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            setInstances(response.data.data);
            
            toast.success("Trade detail deleted successfully");
          } catch (error) {
            toast.error("Failed to delete trade detail");
          }
        },
      },
    });
  };

  const handlePlaceOrder = async () => {
    // TODO: Implement place order functionality
    toast.info("Place order functionality to be implemented");
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
            
            // Refresh instances data
            const response = await axios.get(`${API_URL}/user/instances`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            setInstances(response.data.data);
            
            toast.success(`${percentage}% position exited successfully`);
          } catch (error) {
            toast.error("Failed to exit position");
          }
        },
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getBooleanDisplay = (value: boolean) => {
    return value ? "Yes" : "No";
  };

  const getBooleanColor = (value: boolean) => {
    return value ? "text-green-400" : "text-red-400";
  };

  const getExitPercentages = () => {
    const qty = tradeDetail.currentQty;
    if (qty <= 0) return [];
    
    if (qty === 1) return [100];
    if (qty === 2) return [50, 100];
    if (qty === 3) return [33, 67, 100];
    if (qty === 4) return [25, 50, 75, 100];
    
    // For quantities > 4, show common percentages that result in whole numbers
    const percentages = [];
    for (let i = 1; i <= qty; i++) {
      const percentage = Math.round((i / qty) * 100);
      if (percentage <= 100 && !percentages.includes(percentage)) {
        percentages.push(percentage);
      }
    }
    return percentages;
  };

  const getCellValue = (columnId: string) => {
    if (isEditing) {
      switch (columnId) {
        case "qty":
          return (
            <input
              type="number"
              value={editData.qty}
              onChange={(e) => setEditData({ ...editData, qty: parseInt(e.target.value) || 0 })}
              className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "currentQty":
          return (
            <input
              type="number"
              value={editData.currentQty}
              onChange={(e) => setEditData({ ...editData, currentQty: parseInt(e.target.value) || 0 })}
              className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "entrySide":
          return (
            <select
              value={editData.entrySide}
              onChange={(e) => setEditData({ ...editData, entrySide: e.target.value })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          );
        case "entryType":
          return (
            <select
              value={editData.entryType}
              onChange={(e) => setEditData({ ...editData, entryType: e.target.value })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
            </select>
          );
        case "entryPrice":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.entryPrice}
              onChange={(e) => setEditData({ ...editData, entryPrice: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "entrySpotPrice":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.entrySpotPrice}
              onChange={(e) => setEditData({ ...editData, entrySpotPrice: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "stopLossPoints":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.stopLossPoints}
              onChange={(e) => setEditData({ ...editData, stopLossPoints: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "stopLossPremium":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.stopLossPremium}
              onChange={(e) => setEditData({ ...editData, stopLossPremium: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "takeProfitPoints":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.takeProfitPoints}
              onChange={(e) => setEditData({ ...editData, takeProfitPoints: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "takeProfitPremium":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.takeProfitPremium}
              onChange={(e) => setEditData({ ...editData, takeProfitPremium: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "pointOfAdjustment":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.pointOfAdjustment}
              onChange={(e) => setEditData({ ...editData, pointOfAdjustment: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "pointOfAdjustmentLowerLimit":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.pointOfAdjustmentLowerLimit}
              onChange={(e) => setEditData({ ...editData, pointOfAdjustmentLowerLimit: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "pointOfAdjustmentUpperLimit":
          return (
            <input
              type="number"
              step="0.01"
              value={editData.pointOfAdjustmentUpperLimit}
              onChange={(e) => setEditData({ ...editData, pointOfAdjustmentUpperLimit: parseFloat(e.target.value) || 0 })}
              className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "reason":
          return (
            <input
              type="text"
              value={editData.reason}
              onChange={(e) => setEditData({ ...editData, reason: e.target.value })}
              className="w-24 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
        case "userExit":
          return (
            <input
              type="number"
              value={editData.userExit}
              onChange={(e) => setEditData({ ...editData, userExit: parseFloat(e.target.value) || 0 })}
              className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          );
      }
    }

    // Display values
    switch (columnId) {
      case "qty":
        return tradeDetail.qty;
      case "currentQty":
        return tradeDetail.currentQty;
      case "qtyInLots":
        return tradeDetail.qtyInLots || Math.floor(tradeDetail.qty / (optionLotSize.find(lot => lot.optionName.includes('nifty'))?.lotSize || 1));
      case "entrySide":
        return tradeDetail.entrySide;
      case "entryType":
        return tradeDetail.entryType;
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
        return formatNumber(tradeDetail.pointOfAdjustmentUpperLimit);
      case "entryTriggered":
        return getBooleanDisplay(tradeDetail.entryTriggered);
      case "slTriggered":
        return getBooleanDisplay(tradeDetail.slTriggered);
      case "tpTriggered":
        return getBooleanDisplay(tradeDetail.tpTriggered);
      case "reason":
        return tradeDetail.reason || "-";
      case "userExit":
        const percentages = getExitPercentages();
        return (
          <div className="flex flex-wrap gap-1">
            {percentages.map((percentage) => (
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
        return `${baseClass} ${tradeDetail.mtm >= 0 ? "text-green-400" : "text-red-400"}`;
      case "entryTriggered":
      case "slTriggered":
      case "tpTriggered":
        return `${baseClass} ${getBooleanColor(tradeDetail[columnId as keyof TradeDetail] as boolean)}`;
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
                title="Save"
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
                onClick={handlePlaceOrder}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Place Order"
              >
                <Play size={10} />
              </button>
              <button
                onClick={handleEdit}
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