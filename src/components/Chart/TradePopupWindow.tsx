import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, GripHorizontal, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
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

interface TradeManagerPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TradePopupWindow: React.FC<TradePopupWindowProps> = ({ isOpen, onClose }) => {
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<{
    [tradeId: string]: {
      stopLossPremium: number;
      takeProfitPremium: number;
      stopLossPoints: number;
      takeProfitPoints: number;
      qty: number;
    };
  }>({});

  const { instances, setInstances } = useStore();

  const toggleExpanded = (tradeId: string) => {
    const newExpanded = new Set(expandedTrades);
    if (newExpanded.has(tradeId)) {
      newExpanded.delete(tradeId);
    } else {
      newExpanded.add(tradeId);
      // Initialize edit values when expanding
      if (!editValues[tradeId]) {
        const trade = allTrades.find(t => t.id === tradeId);
        if (trade) {
          setEditValues(prev => ({
            ...prev,
            [tradeId]: {
              stopLossPremium: trade.stopLossPremium || 0,
              takeProfitPremium: trade.takeProfitPremium || 0,
              stopLossPoints: trade.stopLossPoints || 0,
              takeProfitPoints: trade.takeProfitPoints || 0,
              qty: trade.qty || 0,
            }
          }));
        }
      }
    }
    setExpandedTrades(newExpanded);
  };

  const handleInputChange = (tradeId: string, field: string, value: number) => {
    setEditValues(prev => ({
      ...prev,
      [tradeId]: {
        ...prev[tradeId],
        [field]: value
      }
    }));
  };

  const saveChanges = async (tradeId: string) => {
    const auth = cookies.get("auth");
    
    try {
      await axios.put(
        `${API_URL}/user/tradeInfo?id=${tradeId}`,
        {
          stopLossPremium: editValues[tradeId].stopLossPremium,
          takeProfitPremium: editValues[tradeId].takeProfitPremium,
          stopLossPoints: editValues[tradeId].stopLossPoints,
          takeProfitPoints: editValues[tradeId].takeProfitPoints,
          qty: editValues[tradeId].qty,
          currentQty: editValues[tradeId].qty,
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
    instance.tradeDetails
      .filter(trade => trade.entrySide !== "UNDEFINED")
      .map(trade => ({
        ...trade,
        instanceId: instance.id,
        indexName: instance.indexName,
        expiry: instance.expiry,
        ltpRange: instance.ltpRange,
      }))
  );

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
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
                    <div className="mt-3">
                      {/* Single Row with all inputs */}
                      <div className="grid grid-cols-6 gap-2 items-center">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            TP Premium
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues[trade.id]?.takeProfitPremium || 0}
                            onChange={(e) =>
                              handleInputChange(trade.id, 'takeProfitPremium', parseFloat(e.target.value) || 0)
                            }
                            onBlur={() => saveChanges(trade.id)}
                            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            TP Points
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues[trade.id]?.takeProfitPoints || 0}
                            onChange={(e) =>
                              handleInputChange(trade.id, 'takeProfitPoints', parseFloat(e.target.value) || 0)
                            }
                            onBlur={() => saveChanges(trade.id)}
                            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            SL Premium
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues[trade.id]?.stopLossPremium || 0}
                            onChange={(e) =>
                              handleInputChange(trade.id, 'stopLossPremium', parseFloat(e.target.value) || 0)
                            }
                            onBlur={() => saveChanges(trade.id)}
                            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            SL Points
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editValues[trade.id]?.stopLossPoints || 0}
                            onChange={(e) =>
                              handleInputChange(trade.id, 'stopLossPoints', parseFloat(e.target.value) || 0)
                            }
                            onBlur={() => saveChanges(trade.id)}
                            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={editValues[trade.id]?.qty || 0}
                            onChange={(e) =>
                              handleInputChange(trade.id, 'qty', parseInt(e.target.value) || 0)
                            }
                            onBlur={() => saveChanges(trade.id)}
                            className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            MTM
                          </label>
                          <div className={`px-2 py-1 text-xs font-medium rounded ${
                            trade.mtm >= 0 ? "text-green-400 bg-green-900/20" : "text-red-400 bg-red-900/20"
                          }`}>
                            {formatCurrency(trade.mtm)}
                          </div>
                        </div>
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

// New Popup Window Component
const TradeManagerPopup: React.FC<TradeManagerPopupProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={`fixed z-[10001] cursor-move select-none ${
        isDragging ? "opacity-90" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "800px",
        maxHeight: "80vh",
      }}
    >
      <div
        className="flex items-center space-x-2 p-2 bg-gray-800 border border-gray-700 rounded-t-lg cursor-move"
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal size={16} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-white">Trade Manager - Popup</h3>
        <div className="flex-1"></div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="bg-gray-900 border-x border-b border-gray-700 rounded-b-lg">
        <TradePopupWindow isOpen={true} onClose={() => {}} />
      </div>
    </div>
  );
};

export default TradePopupWindow;
export { TradeManagerPopup };