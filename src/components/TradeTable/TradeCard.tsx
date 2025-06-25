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
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-medium text-white">
              {trade.indexName}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">Expiry: {trade.expiry}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
            {trade.entryType === "UNDEFINED" ? (
              <>
                <button
                  onClick={onPlaceOrder}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Place Order
                </button>
                <button
                  onClick={onEdit}
                  className="px-2 py-1 bg-gray-700 text-xs rounded hover:bg-gray-600"
                >
                  Edit
                </button>
                <button
                  onClick={onDeleteOrder}
                  className="px-2 py-1 bg-red-500/80 text-white text-xs rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                {trade.entryTriggered === false && trade.entryType === "LIMIT" ? (
                  <button
                    onClick={onCancelOrder}
                    className="px-2 py-1 bg-red-500/80 text-xs rounded hover:bg-red-400"
                  >
                    Cancel Order
                  </button>
                ) : null}
                <button
                  onClick={onEdit}
                  className="px-2 py-1 bg-gray-700 text-xs rounded hover:bg-gray-600"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-400">LTP Spot</p>
            <p className="text-xs sm:text-sm font-medium text-white">{formatNumber(0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Leg Count</p>
            <p className="text-xs sm:text-sm font-medium text-white">{trade.legCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">LTP Range</p>
            <p className="text-xs sm:text-sm font-medium text-white">
              {formatNumber(trade.ltpRange)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">MTM</p>
            <p className="text-xs sm:text-sm font-medium text-white">
              {formatCurrency(0)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
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
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <p className="text-xs text-gray-400">Lowest Value</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {formatNumber(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Entry</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {trade.entryPrice ? formatNumber(trade.entryPrice) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Quantity</p>
              <p className="text-xs sm:text-sm font-medium text-white">
                {trade.qty || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Stop Loss</p>
              <p className="text-xs sm:text-sm font-medium text-red-400">
                {trade.stopLossPremium
                  ? formatNumber(trade.stopLossPremium)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Target</p>
              <p className="text-xs sm:text-sm font-medium text-green-400">
                {trade.takeProfitPremium
                  ? formatNumber(trade.takeProfitPremium)
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Strategy SL</p>
              <p className="text-xs sm:text-sm font-medium text-red-400">
                {trade.strategySl ? formatNumber(trade.strategySl) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Strategy Trailing</p>
              <p className="text-xs sm:text-sm font-medium text-green-400">
                {trade.strategyTrailing ? formatNumber(trade.strategyTrailing) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Live Position</p>
              <p className="text-xs sm:text-sm font-medium text-white">{"-"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-2">Exit Percentages</p>
              <div className="flex space-x-1 sm:space-x-2">
                <button className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600">25%</button>
                <button className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600">50%</button>
                <button className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600">100%</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeCard;