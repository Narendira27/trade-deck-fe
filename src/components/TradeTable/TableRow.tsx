import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, Play, X, Shield } from "lucide-react";
import { type Trade } from "../../types/trade";
import { type Column } from "./ColumnManager";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import useStore from "../../store/store";

interface TableRowProps {
  trade: Trade;
  columns: Column[];
  onPlaceOrder: () => void;
  onDeleteOrder: () => void;
  onEdit: () => void;
  onCancelOrder: () => void;
  onClosePartial: (percent: number) => void;
  onHedge: () => void;
}

const TableRow: React.FC<TableRowProps> = ({
  trade,
  columns,
  onPlaceOrder,
  onDeleteOrder,
  onEdit,
  onCancelOrder,
  onClosePartial,
  onHedge,
}) => {
  const [getindexPrice, setGetindexPrice] = useState(0);
  const [lowestValue, setLowestValue] = useState(0);
  const [mtm, setMtm] = useState(0);

  const { indexPrice, optionValues, optionLotSize, optionPrice } = useStore();

  // Memoize the index price to prevent unnecessary updates
  const currentIndexPrice = useMemo(() => {
    return indexPrice.find((each) => each.name === trade.indexName);
  }, [indexPrice, trade.indexName]);

  // Memoize the option values to prevent unnecessary updates
  const currentOptionValue = useMemo(() => {
    if (!optionValues) return null;
    return optionValues.find((each) => each.id === trade.id);
  }, [optionValues, trade.id]);

  const calculateMtm = useMemo(() => {
    if (!trade) return 0;

    const lotSizeObj = optionLotSize.find(
      (lot) =>
        lot.optionName.toLowerCase() ===
        (trade.indexName + trade.expiry).toLowerCase()
    );

    const lotSize = lotSizeObj?.lotSize ?? 1;

    const totalMtm = trade.liveTradePositions.reduce((acc, position) => {
      const priceObj = optionPrice.find(
        (price) => price.optionName === position.optionName
      );

      const currentPrice = priceObj?.price ?? 0;
      const entryPrice = position.entryPrice ?? 0;
      const quantity = parseInt(position.currentQty) ?? 1;

      let mtm = 0;

      if (trade.entrySide === "SELL") {
        mtm = lotSize * (entryPrice - currentPrice) * quantity;
      } else if (trade.entrySide === "BUY") {
        mtm = lotSize * (currentPrice - entryPrice) * quantity;
      }

      return acc + mtm;
    }, 0);

    return totalMtm;
  }, [trade, optionLotSize, optionPrice]);

  useEffect(() => {
    if (calculateMtm) {
      setMtm(calculateMtm);
    }
  }, [calculateMtm]);

  useEffect(() => {
    if (currentIndexPrice && currentIndexPrice.price !== getindexPrice) {
      setGetindexPrice(currentIndexPrice.price);
    }
  }, [currentIndexPrice, getindexPrice]);

  useEffect(() => {
    if (currentOptionValue) {
      setLowestValue(currentOptionValue.lowestCombinedPremium);
    }
  }, [currentOptionValue, lowestValue]);

  const getCellValue = (columnId: string) => {
    switch (columnId) {
      case "index":
        return trade.indexName;
      case "side":
        return trade.entrySide;
      case "ltpSpot":
        return formatNumber(getindexPrice);
      case "legCount":
        return trade.legCount;
      case "expiry":
        return trade.expiry;
      case "ltpRange":
        return formatNumber(trade.ltpRange);
      case "lowestValue":
        return formatNumber(lowestValue) || formatNumber(0);
      case "entry":
        return trade.entryPrice ? formatNumber(trade.entryPrice) : "-";
      case "qty":
        return trade.qty || "-";
      case "sl":
        return trade.stopLossPremium
          ? formatNumber(trade.stopLossPremium)
          : "-";
      case "target":
        return trade.takeProfitPremium
          ? formatNumber(trade.takeProfitPremium)
          : "-";
      case "entrySpot":
        return formatNumber(trade.entrySpotPrice);
      case "mtm":
        return formatCurrency(mtm);
      case "pointOfAdjustment":
        return trade.pointOfAdjustment
          ? formatNumber(trade.pointOfAdjustment)
          : "-";
      case "adjustmentUpperLimit":
        return trade.pointOfAdjustmentUpperLimit
          ? formatNumber(trade.pointOfAdjustmentUpperLimit)
          : "-";
      case "adjustmentLowerLimit":
        return trade.pointOfAdjustmentLowerLimit
          ? formatNumber(trade.pointOfAdjustmentLowerLimit)
          : "-";
      case "orderType":
        return trade.entryType;
      case "entryTriggered":
        return trade.entryTriggered ? "Yes" : "No";
      case "strategySl":
        return trade.strategySl ? formatNumber(trade.strategySl) : "-";
      case "strategyTrailing":
        return trade.strategyTrailing
          ? formatNumber(trade.strategyTrailing)
          : "-";
      case "exitPercentages":
        if (!trade.alive) return "-";
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => onClosePartial(25)}
              className="px-1 py-0.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            >
              25%
            </button>
            <button
              onClick={() => onClosePartial(50)}
              className="px-1 py-0.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            >
              50%
            </button>
            <button
              onClick={() => onClosePartial(100)}
              className="px-1 py-0.5 text-xs bg-gray-700 rounded hover:bg-gray-600"
            >
              100%
            </button>
          </div>
        );
      default:
        return "-";
    }
  };

  const getCellClassName = (columnId: string) => {
    const baseClass =
      "px-3 py-2 text-xs leading-normal border-b border-gray-800";

    switch (columnId) {
      case "sl":
        return `${baseClass} text-red-400`;
      case "target":
        return `${baseClass} text-green-400`;
      case "mtm":
        return `${mtm} ${baseClass} ${
          mtm > 0 ? "text-green-400" : mtm < 0 ? "text-red-400" : "text-white"
        }`;
      case "strategySl":
        return `${baseClass} text-red-400 `;
      case "strategyTrailing":
        return `${baseClass} text-green-400 `;
      default:
        return `${baseClass} text-white`;
    }
  };

  return (
    <tr className="hover:bg-gray-800/50 transition-colors">
      <td className="px-2 py-2 text-xs font-medium text-white border-b border-gray-800">
        {trade.alive && (
          <div className="flex space-x-1">
            {trade.entryType === "UNDEFINED" ? (
              <>
                <button
                  onClick={onPlaceOrder}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  title="Place Order"
                >
                  <Play size={12} />
                </button>
                <button
                  onClick={onEdit}
                  className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  title="Edit"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={onHedge}
                  className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  title="Hedge"
                >
                  <Shield size={12} />
                </button>
                <button
                  onClick={onDeleteOrder}
                  className="p-1 bg-red-500/80 text-white rounded hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </>
            ) : (
              <>
                {trade.entryTriggered === false &&
                trade.entryType === "LIMIT" ? (
                  <>
                    <button
                      onClick={onCancelOrder}
                      className="p-1 bg-red-500/80 rounded hover:bg-red-400 transition-colors"
                      title="Cancel Order"
                    >
                      <X size={12} />
                    </button>
                    <button
                      onClick={onEdit}
                      className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={onHedge}
                      className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                      title="Hedge"
                    >
                      <Shield size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onEdit}
                      className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={onHedge}
                      className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                      title="Hedge"
                    >
                      <Shield size={12} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </td>
      {columns
        .filter((col) => col.visible)
        .map((column) => (
          <td key={column.id} className={getCellClassName(column.id)}>
            {getCellValue(column.id)}
          </td>
        ))}
    </tr>
  );
};

export default TableRow;
