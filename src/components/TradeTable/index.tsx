import React, { useState } from "react";
import { Plus } from "lucide-react";
import { type Trade } from "../../types/trade";
import TableRow from "./TableRow";
import TableHeader from "./TableHeader";
import AddTradeModal from "../modals/AddTradeModal";
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
}

const TradeTable: React.FC<TradeTableProps> = ({ trades }) => {
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          Trading Positions
        </h2>
        <button
          onClick={() => setIsAddTradeModalOpen(true)}
          className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded-md hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} className="sm:size-6" />
          <span>Add Trade</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="min-w-[1000px]">
            <table className="w-full border-collapse">
              <TableHeader />
              <tbody>
                {trades.length > 0 ? (
                  trades.map((trade) => (
                    <TableRow
                      key={trade.id}
                      trade={trade}
                      onPlaceOrder={() => handlePlaceOrder(trade.id)}
                      onDeleteOrder={() => handleDeleteOrder(trade.id)}
                      onEdit={() => handleEdit(trade.id)}
                      onCancelOrder={() => handleCancelOrder(trade.id)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={15} className="text-center py-8 text-gray-400">
                      No trades to display
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <AddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
      />

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
