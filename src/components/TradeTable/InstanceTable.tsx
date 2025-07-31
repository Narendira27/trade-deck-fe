import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { type Instance, type TradeDetail } from "../../types/trade";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import TradeDetailRow from "./TradeDetailRow";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import useStore from "../../store/store";

interface InstanceTableProps {
  instances: Instance[];
}

const InstanceTable: React.FC<InstanceTableProps> = ({ instances }) => {
  const [expandedInstances, setExpandedInstances] = useState<Set<string>>(new Set());
  const { setInstances } = useStore();

  const toggleExpanded = (instanceId: string) => {
    const newExpanded = new Set(expandedInstances);
    if (newExpanded.has(instanceId)) {
      newExpanded.delete(instanceId);
    } else {
      newExpanded.add(instanceId);
    }
    setExpandedInstances(newExpanded);
  };

  const handleAddPosition = async (instanceId: string) => {
    // TODO: Implement add position modal/form
    toast.info("Add position functionality to be implemented");
  };

  const handleDeleteInstance = async (instanceId: string) => {
    const auth = cookies.get("auth");
    
    toast.warning("Are you sure you want to delete this instance?", {
      action: {
        label: "Yes, Delete",
        onClick: async () => {
          try {
            await axios.delete(`${API_URL}/user/instances/${instanceId}`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            
            // Refresh instances data
            const response = await axios.get(`${API_URL}/user/instances`, {
              headers: { Authorization: `Bearer ${auth}` },
            });
            setInstances(response.data.data);
            
            toast.success("Instance deleted successfully");
          } catch (error) {
            toast.error("Failed to delete instance");
          }
        },
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* Desktop Table View */}
        <div className="hidden lg:block h-full">
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700 w-12">
                    
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    Index Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    Expiry
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    LTP Range
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    Leg Count
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 border-b border-gray-700 w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {instances.length > 0 ? (
                  instances.map((instance) => (
                    <React.Fragment key={instance.id}>
                      {/* Main Instance Row */}
                      <tr className="hover:bg-gray-800/50 transition-colors border-b border-gray-800">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleExpanded(instance.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedInstances.has(instance.id) ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {instance.indexName}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {instance.expiry}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {formatNumber(instance.ltpRange)}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {instance.legCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAddPosition(instance.id)}
                              className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              title="Add Position"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteInstance(instance.id)}
                              className="p-1.5 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                              title="Delete Instance"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Trade Details */}
                      {expandedInstances.has(instance.id) && instance.tradeDetails && (
                        <tr>
                          <td colSpan={6} className="px-0 py-0">
                            <div className="bg-gray-800/30 border-l-4 border-blue-500">
                              <div className="p-4">
                                <h4 className="text-sm font-medium text-white mb-3">
                                  Trade Details
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-700">
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Qty</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Current Qty</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Entry Side</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Entry Type</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Entry Price</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">SL Points</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">SL Premium</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">TP Points</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">TP Premium</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">POA</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">POA Lower</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">POA Upper</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Entry Triggered</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">SL Triggered</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">TP Triggered</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Reason</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">User Exit</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Updated At</th>
                                        <th className="px-3 py-2 text-xs font-medium text-gray-300 text-left">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {instance.tradeDetails.map((detail) => (
                                        <TradeDetailRow
                                          key={detail.id}
                                          tradeDetail={detail}
                                          instanceId={instance.id}
                                        />
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No instances to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          <div className="space-y-4 p-4 h-full overflow-auto">
            {instances.length > 0 ? (
              instances.map((instance) => (
                <div
                  key={instance.id}
                  className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-white">
                          {instance.indexName}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {instance.expiry} • Range: {formatNumber(instance.ltpRange)} • Legs: {instance.legCount}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleAddPosition(instance.id)}
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          title="Add Position"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteInstance(instance.id)}
                          className="p-2 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                          title="Delete Instance"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleExpanded(instance.id)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          {expandedInstances.has(instance.id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedInstances.has(instance.id) && instance.tradeDetails && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-medium text-white mb-3">
                          Trade Details ({instance.tradeDetails.length})
                        </h4>
                        <div className="space-y-3">
                          {instance.tradeDetails.map((detail) => (
                            <div
                              key={detail.id}
                              className="bg-gray-700 p-3 rounded-lg"
                            >
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-400">Qty:</span>
                                  <span className="text-white ml-1">{detail.qty}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Current Qty:</span>
                                  <span className="text-white ml-1">{detail.currentQty}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Side:</span>
                                  <span className="text-white ml-1">{detail.entrySide}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Type:</span>
                                  <span className="text-white ml-1">{detail.entryType}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Entry:</span>
                                  <span className="text-white ml-1">{formatNumber(detail.entryPrice)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">User Exit:</span>
                                  <span className="text-white ml-1">{detail.userExit}%</span>
                                </div>
                              </div>
                              <div className="flex justify-end mt-3 space-x-2">
                                <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                  Place Order
                                </button>
                                <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500">
                                  Update
                                </button>
                                <button className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No instances to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstanceTable;