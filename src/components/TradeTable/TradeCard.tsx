import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type Trade } from "../../types/trade";
import { formatNumber, formatCurrency } from "../../utils/formatters";

interface TradeCardProps {
  trade: Trade;
  onPlaceOrder: () => void;
  onDeleteOrder: () => void;
  onEdit: () => void;
  onCancelOrder: () => void;
}

const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  onPlaceOrder,
  onDeleteOrder,
  onEdit,
  onCancelOrder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">
              {trade.indexName}
            </h3>
            <p className="text-sm text-gray-400">Expiry: {trade.expiry}</p>
          </div>
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
                className="px-3 py-1 bg-gray-700 text-xs rounded hover:bg-gray-600"
              >
                Edit
              </button>

              <button
                onClick={onDeleteOrder}
                className="px-3 py-1  bg-red-500/80 text-white text-xs rounded hover:bg-red-600"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              {trade.entryTriggered === false && trade.entryType === "LIMIT" ? (
                <button
                  onClick={onCancelOrder}
                  className="px-3 py-1  bg-red-500/80 text-xs rounded  hover:bg-red-400"
                >
                  Cancel Order
                </button>
              ) : null}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-sm text-gray-400">LTP Spot</p>
            <p className="text-sm font-medium text-white">{formatNumber(0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Leg Count</p>
            <p className="text-sm font-medium text-white">{trade.legCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">LTP Range</p>
            <p className="text-sm font-medium text-white">
              {formatNumber(trade.ltpRange)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">MTM</p>
            <p
              className={`text-sm font-medium ${
                {
                  /*trade.mtm >= 0 ? "text-green-400" : "text-red-400"*/
                }
              }`}
            >
              {formatCurrency(0)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span>View Details</span>
          {isExpanded ? (
            <ChevronDown size={16} className="ml-1" />
          ) : (
            <ChevronRight size={16} className="ml-1" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-3">
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
              <p className="text-sm text-gray-400">Live Position</p>
              <p className="text-sm font-medium text-white">{"-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-400 mb-2">Exit Percentages</p>
              <div className="flex space-x-2">
                <button className={`px-2 py-1 text-xs rounded`}>25%</button>
                <button className={`px-2 py-1 text-xs rounded `}>50%</button>
                <button className={`px-2 py-1 text-xs rounded `}>100%</button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400">Trailing</p>
              <button className={`px-3 py-1 text-xs rounded `}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeCard;
