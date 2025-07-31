import React, { useState } from "react";
import { Edit, Trash2, Play, Check, X } from "lucide-react";
import { type TradeDetail } from "../../types/trade";
import { formatNumber } from "../../utils/formatters";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import useStore from "../../store/store";

interface TradeDetailRowProps {
  tradeDetail: TradeDetail;
  instanceId: string;
}

const TradeDetailRow: React.FC<TradeDetailRowProps> = ({
  tradeDetail,
  instanceId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(tradeDetail);
  const { setInstances } = useStore();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getBooleanDisplay = (value: boolean) => {
    return value ? "Yes" : "No";
  };

  const getBooleanColor = (value: boolean) => {
    return value ? "text-green-400" : "text-red-400";
  };

  return (
    <tr className="hover:bg-gray-600/30 transition-colors">
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="number"
            value={editData.qty}
            onChange={(e) => setEditData({ ...editData, qty: parseInt(e.target.value) || 0 })}
            className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          tradeDetail.qty
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="number"
            value={editData.currentQty}
            onChange={(e) => setEditData({ ...editData, currentQty: parseInt(e.target.value) || 0 })}
            className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          tradeDetail.currentQty
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <select
            value={editData.entrySide}
            onChange={(e) => setEditData({ ...editData, entrySide: e.target.value })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        ) : (
          tradeDetail.entrySide
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <select
            value={editData.entryType}
            onChange={(e) => setEditData({ ...editData, entryType: e.target.value })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="MARKET">MARKET</option>
            <option value="LIMIT">LIMIT</option>
          </select>
        ) : (
          tradeDetail.entryType
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.entryPrice}
            onChange={(e) => setEditData({ ...editData, entryPrice: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.entryPrice)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-red-400">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.stopLossPoints}
            onChange={(e) => setEditData({ ...editData, stopLossPoints: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.stopLossPoints)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-red-400">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.stopLossPremium}
            onChange={(e) => setEditData({ ...editData, stopLossPremium: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.stopLossPremium)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-green-400">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.takeProfitPoints}
            onChange={(e) => setEditData({ ...editData, takeProfitPoints: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.takeProfitPoints)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-green-400">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.takeProfitPremium}
            onChange={(e) => setEditData({ ...editData, takeProfitPremium: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.takeProfitPremium)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.pointOfAdjustment}
            onChange={(e) => setEditData({ ...editData, pointOfAdjustment: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.pointOfAdjustment)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.pointOfAdjustmentLowerLimit}
            onChange={(e) => setEditData({ ...editData, pointOfAdjustmentLowerLimit: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.pointOfAdjustmentLowerLimit)
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editData.pointOfAdjustmentUpperLimit}
            onChange={(e) => setEditData({ ...editData, pointOfAdjustmentUpperLimit: parseFloat(e.target.value) || 0 })}
            className="w-20 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          formatNumber(tradeDetail.pointOfAdjustmentUpperLimit)
        )}
      </td>
      <td className={`px-3 py-2 text-xs ${getBooleanColor(tradeDetail.entryTriggered)}`}>
        {getBooleanDisplay(tradeDetail.entryTriggered)}
      </td>
      <td className={`px-3 py-2 text-xs ${getBooleanColor(tradeDetail.slTriggered)}`}>
        {getBooleanDisplay(tradeDetail.slTriggered)}
      </td>
      <td className={`px-3 py-2 text-xs ${getBooleanColor(tradeDetail.tpTriggered)}`}>
        {getBooleanDisplay(tradeDetail.tpTriggered)}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="text"
            value={editData.reason}
            onChange={(e) => setEditData({ ...editData, reason: e.target.value })}
            className="w-24 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          tradeDetail.reason || "-"
        )}
      </td>
      <td className="px-3 py-2 text-xs text-white">
        {isEditing ? (
          <input
            type="number"
            value={editData.userExit}
            onChange={(e) => setEditData({ ...editData, userExit: parseFloat(e.target.value) || 0 })}
            className="w-16 px-1 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        ) : (
          `${tradeDetail.userExit}%`
        )}
      </td>
      <td className="px-3 py-2 text-xs text-gray-400">
        {formatDate(tradeDetail.updatedAt)}
      </td>
      <td className="px-3 py-2">
        <div className="flex space-x-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="Save"
              >
                <Check size={12} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePlaceOrder}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Place Order"
              >
                <Play size={12} />
              </button>
              <button
                onClick={handleEdit}
                className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                title="Edit"
              >
                <Edit size={12} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TradeDetailRow;