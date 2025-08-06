import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, GripHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import useStore from "../../store/store";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";

interface TradePopupWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const TradePopupWindow: React.FC<TradePopupWindowProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [editingTrade, setEditingTrade] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    entryPrice: number;
    stopLossPremium: number;
    takeProfitPremium: number;
    stopLossPoints: number;
    takeProfitPoints: number;
    qty: number;
  }>({
    entryPrice: 0,
    stopLossPremium: 0,
    takeProfitPremium: 0,
    stopLossPoints: 0,
    takeProfitPoints: 0,
    qty: 0,
  });

  const windowRef = useRef<HTMLDivElement>(null);
  const { instances, setInstances } = useStore();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleExpanded = (tradeId: string) => {
    const newExpanded = new Set(expandedTrades);
    if (newExpanded.has(tradeId)) {
      newExpanded.delete(tradeId);
    } else {
      newExpanded.add(tradeId);
    }
    setExpandedTrades(newExpanded);
  };

  const startEditing = (trade: any) => {
    setEditingTrade(trade.id);
    setEditValues({
      entryPrice: trade.entryPrice || 0,
      stopLossPremium: trade.stopLossPremium || 0,
      takeProfitPremium: trade.takeProfitPremium || 0,
      stopLossPoints: trade.stopLossPoints || 0,
      takeProfitPoints: trade.takeProfitPoints || 0,
      qty: trade.qty || 0,
    });
  };

  const cancelEditing = () => {
    setEditingTrade(null);
    setEditValues({
      entryPrice: 0,
      stopLossPremium: 0,
      takeProfitPremium: 0,
      stopLossPoints: 0,
      takeProfitPoints: 0,
      qty: 0,
    });
  };

  const saveChanges = async (tradeId: string) => {
    const auth = cookies.get("auth");
    
    try {
      await axios.put(
        `${API_URL}/user/tradeInfo?id=${tradeId}`,
        {
          entryPrice: editValues.entryPrice,
          stopLossPremium: editValues.stopLossPremium,
          takeProfitPremium: editValues.takeProfitPremium,
          stopLossPoints: editValues.stopLossPoints,
          takeProfitPoints: editValues.takeProfitPoints,
          qty: editValues.qty,
          currentQty: editValues.qty,
        },
        {
          headers: { Authorization: `Bearer ${auth}` },
        }
      );

      // Refresh instances data
      const response = await axios.get(`${API_URL}/user/instances`, {
        headers: { Authorization: `Bearer ${auth}` },
      });
      setInstances(response.data.data);

      toast.success("Trade updated successfully");
      setEditingTrade(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update trade");
    }
  };

  const handleCloseAll = async () => {
    const auth = cookies.get("auth");
    
    toast.warning("Are you sure you want to close all positions?", {
      action: {
        label: "Yes, Close All",
        onClick: async () => {
          try {
            await axios.get(`${API_URL}/user/squareOffAll`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            
            // Refresh instances data
            const response = await axios.get(`${API_URL}/user/instances`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            setInstances(response.data.data);
            
            toast.success("All positions closed successfully");
          } catch (error) {
            console.error(error);
            toast.error("Failed to close all positions");
          }
        },
      },
    });
  };

  if (!isOpen) return null;

  // Get all active trades from instances
  const allTrades = instances.flatMap(instance => 
    instance.tradeDetails.map(trade => ({
      ...trade,
      instanceId: instance.id,
      indexName: instance.indexName,
      expiry: instance.expiry,
      ltpRange: instance.ltpRange,
    }))
  );

  return (
    <div
      ref={windowRef}
      className={`fixed z-[10001] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl cursor-move select-none ${
        isDragging ? "opacity-90" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "600px",
        maxHeight: "80vh",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 rounded-t-lg cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <GripHorizontal size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Trade Manager</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCloseAll}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Close All
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {allTrades.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            No active trades found
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {allTrades.map((trade) => (
              <div key={trade.id} className="bg-gray-800 rounded-lg border border-gray-700">
                {/* Main Trade Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleExpanded(trade.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {expandedTrades.has(trade.id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {trade.indexName} - {trade.expiry} - {trade.ltpRange}
                        </div>
                        <div className="text-xs text-gray-400">
                          {trade.entrySide} • {trade.entryType} • Qty: {trade.qty}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        trade.mtm >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {formatCurrency(trade.mtm)}
                      </div>
                      <div className="text-xs text-gray-400">MTM</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTrades.has(trade.id) && (
                  <div className="px-3 pb-3 border-t border-gray-700">
                    <div className="mt-3 space-y-3">
                      {editingTrade === trade.id ? (
                        // Edit Mode
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Entry Price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.entryPrice}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  entryPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={editValues.qty}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  qty: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              SL Premium
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.stopLossPremium}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  stopLossPremium: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              TP Premium
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.takeProfitPremium}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  takeProfitPremium: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              SL Points
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.stopLossPoints}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  stopLossPoints: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              TP Points
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editValues.takeProfitPoints}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  takeProfitPoints: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-400">Entry Price:</span>
                            <span className="text-white ml-2">
                              {formatNumber(trade.entryPrice)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Quantity:</span>
                            <span className="text-white ml-2">{trade.qty}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">SL Premium:</span>
                            <span className="text-red-400 ml-2">
                              {formatNumber(trade.stopLossPremium)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">TP Premium:</span>
                            <span className="text-green-400 ml-2">
                              {formatNumber(trade.takeProfitPremium)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">SL Points:</span>
                            <span className="text-red-400 ml-2">
                              {formatNumber(trade.stopLossPoints)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">TP Points:</span>
                            <span className="text-green-400 ml-2">
                              {formatNumber(trade.takeProfitPoints)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                        {editingTrade === trade.id ? (
                          <>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveChanges(trade.id)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditing(trade)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradePopupWindow;