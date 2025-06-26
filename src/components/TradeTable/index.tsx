import React, { useState } from "react";
import { type Trade } from "../../types/trade";
import TableRow from "./TableRow";
import TableHeader from "./TableHeader";
import { type Column } from "./ColumnManager";
import PlaceOrderModal from "../modals/PlaceOrderModal";
import TradeCard from "./TradeCard";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import getTradeData from "../../utils/getTradeData";
import useStore from "../../store/store";
import EditModal from "../modals/EditModal";

interface TradeTableProps {
  trades: Trade[];
  columns: Column[];
}

const TradeTable: React.FC<TradeTableProps> = ({ trades, columns }) => {
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const { setTrades } = useStore();

  const handlePlaceOrder = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setIsPlaceOrderModalOpen(true);
  };

  const handleEdit = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (tradeId: string) => {
    const auth = cookies.get("auth");
    const deleteReq = axios.delete(API_URL + "/user/tradeInfo?id=" + tradeId, {
      headers: { Authorization: "Bearer " + auth },
    });
    toast.promise(deleteReq, {
      loading: "Deleting ....",
      success: async () => {
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        return "Deleted successfully!";
      },
      error: "Deletion failed.",
    });
  };

  const handleDeleteOrder = (tradeId: string) => {
    toast.warning("Do you want to delete ?", {
      action: {
        label: "Yes",
        onClick: () => handleDelete(tradeId),
      },
    });
  };

  const cancelOrder = (tradeId: string) => {
    const auth = cookies.get("auth");
    const deleteReq = axios.delete(
      API_URL + "/user/cancelOrder?id=" + tradeId,
      {
        headers: { Authorization: "Bearer " + auth },
      }
    );
    toast.promise(deleteReq, {
      loading: "Cancelling Order ....",
      success: async () => {
        const result = await getTradeData();
        if (result.status === "ok") {
          setTrades(result.tradeInfo);
        }
        return "Cancelled successfully!";
      },
      error: "Cancellation failed.",
    });
  };

  const handleCancelOrder = (tradeId: string) => {
    toast.warning("Do you want to Cancel Order ?", {
      action: {
        label: "Yes",
        onClick: () => cancelOrder(tradeId),
      },
    });
  };

  function canExitPosition(currentQty: number, userExit: number): boolean {
    if (currentQty <= 0 || userExit <= 0 || userExit > 100) {
      return false; // Invalid data
    }

    const lotsToClose = (currentQty * userExit) / 100;

    return lotsToClose >= 1 && Number.isInteger(lotsToClose);
  }

  const handleClosePartialExecution = (id: string, percent: number) => {
    const findObj = trades.find((each) => each.id === id);
    if (!findObj) {
      toast.error("Something Went Wrong");
      return;
    }
    const canExit = canExitPosition(findObj.currentQty, percent);
    if (canExit === false) {
      toast.error(`Cannot exit ${percent}%. You can only exit whole lots.`);
      return;
    }

    const auth = cookies.get("auth");
    const closeReq = axios.get(API_URL + "/user/userExit", {
      params: { id, exit: percent },
      headers: { Authorization: "Bearer " + auth },
    });

    toast.promise(closeReq, {
      loading: `Closing ${percent}%...`,
      success: async () => {
        return `${percent}% closed successfully!`;
      },
      error: "Partial close failed.",
    });
  };

  const handleClosePartial = (id: string, percent: number) => {
    toast.warning(
      `Are you sure you want to close ${percent}% of this position?`,
      {
        action: {
          label: "Yes, Close",
          onClick: () => handleClosePartialExecution(id, percent),
        },
      }
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* Desktop Table View */}
        <div className="hidden lg:block h-full">
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse">
              <TableHeader columns={columns} />
              <tbody>
                {trades.length > 0 ? (
                  trades.map((trade) => (
                    <TableRow
                      key={trade.id}
                      trade={trade}
                      columns={columns}
                      onPlaceOrder={() => handlePlaceOrder(trade.id)}
                      onDeleteOrder={() => handleDeleteOrder(trade.id)}
                      onEdit={() => handleEdit(trade.id)}
                      onCancelOrder={() => handleCancelOrder(trade.id)}
                      onClosePartial={(percent) =>
                        handleClosePartial(trade.id, percent)
                      }
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.filter((col) => col.visible).length + 1}
                      className="text-center py-8 text-gray-400"
                    >
                      No trades to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 h-full overflow-auto">
          {trades.length > 0 ? (
            trades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onPlaceOrder={() => handlePlaceOrder(trade.id)}
                onDeleteOrder={() => handleDeleteOrder(trade.id)}
                onEdit={() => handleEdit(trade.id)}
                onCancelOrder={() => handleCancelOrder(trade.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 col-span-full">
              No trades to display
            </div>
          )}
        </div>
      </div>

      <PlaceOrderModal
        isOpen={isPlaceOrderModalOpen}
        onClose={() => setIsPlaceOrderModalOpen(false)}
        tradeId={selectedTradeId}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tradeId={selectedTradeId}
      />
    </div>
  );
};

export default TradeTable;
