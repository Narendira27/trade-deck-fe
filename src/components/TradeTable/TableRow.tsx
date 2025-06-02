import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type Trade } from "../../types/trade";
import { formatNumber, formatCurrency } from "../../utils/formatters";

interface TableRowProps {
  trade: Trade;
  onPlaceOrder: () => void;
  onDeleteOrder: () => void;
  onEdit: () => void;
  onCancelOrder: () => void;
}

const TableRow: React.FC<TableRowProps> = ({
  trade,
  onPlaceOrder,
  onDeleteOrder,
  onEdit,
  onCancelOrder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
        <td className="px-4 py-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </td>
        <td className="px-4 py-3 text-sm font-medium text-white">
          {trade.indexName}
        </td>

        <td className="px-4 py-3 text-sm font-medium text-white">
          {formatNumber(trade.entrySpotPrice)}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-white">
          {trade.legCount}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-white">
          {trade.expiry}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-white">
          {formatNumber(trade.ltpRange)}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-white">
          {trade.entryType === "UNDEFINED" ? (
            <>
              <button
                onClick={onPlaceOrder}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Place Order
              </button>

              <button
                onClick={onEdit}
                className="px-3 py-1 ml-4 bg-gray-700 text-xs rounded hover:bg-gray-600"
              >
                Edit
              </button>

              <button
                onClick={onDeleteOrder}
                className="px-3 py-1 ml-4 bg-red-500/80 text-white text-xs rounded hover:bg-red-600"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              {trade.entryTriggered === false && trade.entryType === "LIMIT" ? (
                <>
                  <button
                    onClick={onCancelOrder}
                    className="px-3 py-1  bg-red-500/80 text-xs rounded  hover:bg-red-400"
                  >
                    Cancel Order
                  </button>
                  <button
                    onClick={onEdit}
                    className="px-3 py-1 ml-4 bg-gray-700 text-xs rounded hover:bg-gray-600"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <button
                  onClick={onEdit}
                  className="px-3 py-1 ml-4 bg-gray-700 text-xs rounded hover:bg-gray-600"
                >
                  Edit
                </button>
              )}
            </>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-800/30">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Lowest Value</p>
                <p className="text-sm font-medium text-white">
                  {formatNumber(0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Entry</p>
                <p className="text-sm font-medium text-white">
                  {trade.entryPrice ? formatNumber(trade.entryPrice) : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Quantity</p>
                <p className="text-sm font-medium text-white">
                  {trade.qty || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Exit</p>
                {trade.entryPrice && (
                  <div className="flex space-x-2 mt-0.5">
                    <button
                      className={`px-2 py-1 text-xs rounded 
                         bg-gray-700 cursor-pointer hover:bg-gray-700/60`}
                    >
                      25%
                    </button>
                    <button
                      className={`px-2 py-1 text-xs rounded 
                         bg-gray-700 cursor-pointer hover:bg-gray-700/60`}
                    >
                      50%
                    </button>
                    <button
                      className={`px-2 py-1 text-xs rounded 
                         bg-gray-700 cursor-pointer hover:bg-gray-700/60`}
                    >
                      100%
                    </button>
                  </div>
                )}
              </div>
              {/* <div>
                <p className="text-sm text-gray-400">Trailing</p>
                <button
                  className={`px-3 py-1 text-xs rounded ${
                    trade.trailing ? "bg-green-500" : "bg-gray-700"
                  }`}
                >
                  {trade.trailing ? "Yes" : "No"}
                </button>
              </div> */}
              <div>
                <p className="text-sm text-gray-400">Stop Loss</p>
                <p className="text-sm font-medium text-red-400">
                  {trade.stopLoss ? formatNumber(trade.stopLoss) : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Target</p>
                <p className="text-sm font-medium text-green-400">
                  {trade.takeProfit ? formatNumber(trade.takeProfit) : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Entry Spot Price</p>
                <p className="text-sm font-medium text-white">
                  {formatNumber(trade.entrySpotPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">MTM</p>
                <p className="text-sm font-medium text-white">
                  {formatCurrency(0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Live Position</p>
                <p className="text-sm font-medium text-white">{"-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Point of Adjustment</p>
                <p className="text-sm font-medium text-white">
                  {trade.pointOfAdjustment
                    ? formatNumber(trade.pointOfAdjustment)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">
                  Adjustment Price Upper Limit
                </p>
                <p className="text-sm font-medium text-white">
                  {trade.pointOfAdjustmentUpperLimit
                    ? formatNumber(trade.pointOfAdjustmentUpperLimit)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">
                  Adjustment Price Lower Limit
                </p>
                <p className="text-sm font-medium text-white">
                  {trade.pointOfAdjustmentLowerLimit
                    ? formatNumber(trade.pointOfAdjustmentLowerLimit)
                    : "-"}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default TableRow;
