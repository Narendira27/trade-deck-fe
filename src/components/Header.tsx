import React, { useState } from "react";
import { BarChart2, Plus } from "lucide-react";
import ColumnManager, { type Column } from "./TradeTable/ColumnManager";
import AddTradeModal from "./modals/AddTradeModal";

interface HeaderProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
}

const Header: React.FC<HeaderProps> = ({ columns, onColumnsChange }) => {
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);

  return (
    <>
      <header className="bg-gray-900 text-white py-4 px-2 lg:py-2 lg:px- flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <BarChart2 className="text-blue-500" size={18} />
          <h1 className="text-xl sm:text-sm font-semibold">TradeDeck</h1>
        </div>

        <div className="flex items-center space-x-3">
          <ColumnManager columns={columns} onColumnsChange={onColumnsChange} />
          <button
            onClick={() => setIsAddTradeModalOpen(true)}
            className="items-center space-x-1 hidden lg:flex lg:space-x-2 px-2 lg:px-2 py-1.5 lg:py-2 bg-blue-500 text-white text-sm lg:text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} className="" />
            <span className="text-sm">Add Trade</span>
          </button>

          <button
            onClick={() => setIsAddTradeModalOpen(true)}
            className="items-center space-x-1 sm:hidden flex  px-2  py-1.5 mr-15 bg-blue-500 text-white text-sm sm:text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={10} className="sm:size-6" />
            <span className="text-[12px]">Add Trade</span>
          </button>
        </div>
      </header>

      <AddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
      />
    </>
  );
};

export default Header;
