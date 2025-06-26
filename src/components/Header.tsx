import React, { useState } from "react";
import { BarChart2, Plus, Menu, Shield, TrendingUp } from "lucide-react";
import ColumnManager, { type Column } from "./TradeTable/ColumnManager";
import AddTradeModal from "./modals/AddTradeModal";
import DraggableBoxColumnManager from "./DraggableBoxColumnManager";
import PortfolioModal from "./modals/PortfolioModal";
import HedgeModal from "./modals/HedgeModal";
import useStore from "../store/store";
import { type DraggableBoxColumn } from "./DraggableBox";

interface HeaderProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onMenuToggle: () => void;
  draggableColumns: DraggableBoxColumn[];
  onDraggableColumnsChange: (columns: DraggableBoxColumn[]) => void;
}

const Header: React.FC<HeaderProps> = ({
  columns,
  onColumnsChange,
  onMenuToggle,
  draggableColumns,
  onDraggableColumnsChange,
}) => {
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isHedgeModalOpen, setIsHedgeModalOpen] = useState(false);
  const { showDraggable } = useStore();

  return (
    <>
      <header className="bg-gray-900 text-white py-2 px-2 lg:py-3 lg:px-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <BarChart2 className="text-blue-500" size={20} />
          <h1 className="text-lg lg:text-xl font-semibold">TradeDeck</h1>
        </div>

        <div className="flex items-center space-x-1 lg:space-x-3">
          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            <ColumnManager
              columns={columns}
              onColumnsChange={onColumnsChange}
            />

            {showDraggable && (
              <DraggableBoxColumnManager
                columns={draggableColumns}
                onColumnsChange={onDraggableColumnsChange}
              />
            )}

            <button
              onClick={() => setIsPortfolioModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              <Shield size={16} />
              <span className="text-sm">Portfolio</span>
            </button>

            {/* <button
              onClick={() => setIsHedgeModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <TrendingUp size={16} />
              <span className="text-sm">Hedge</span>
            </button>
             */}
            <button
              onClick={() => setIsAddTradeModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm">Add Trade</span>
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setIsAddTradeModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>

            <button
              onClick={() => setIsPortfolioModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors"
            >
              <Shield size={14} />
              <span>Portfolio</span>
            </button>

            <button
              onClick={() => setIsHedgeModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
            >
              <TrendingUp size={14} />
              <span>Hedge</span>
            </button>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <AddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
      />

      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
      />

      <HedgeModal
        isOpen={isHedgeModalOpen}
        onClose={() => setIsHedgeModalOpen(false)}
      />
    </>
  );
};

export default Header;
