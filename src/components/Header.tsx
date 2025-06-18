import React, { useState } from "react";
import { BarChart2, Plus, Menu } from "lucide-react";
import ColumnManager, { type Column } from "./TradeTable/ColumnManager";
import AddTradeModal from "./modals/AddTradeModal";
import DraggableBoxColumnManager from "./DraggableBoxColumnManager";
import useStore from "../store/store";

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
  onDraggableColumnsChange
}) => {
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const { showDraggable } = useStore();

  return (
    <>
      <header className="bg-gray-900 text-white py-4 px-2 lg:py-2 lg:px-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <BarChart2 className="text-blue-500" size={18} />
          <h1 className="text-xl sm:text-sm font-semibold">TradeDeck</h1>
        </div>

        <div className="flex items-center space-x-3">
          <ColumnManager columns={columns} onColumnsChange={onColumnsChange} />
          
          {/* Draggable Box Column Manager - only show when draggable box is visible */}
          {showDraggable && (
            <DraggableBoxColumnManager
              columns={draggableColumns}
              onColumnsChange={onDraggableColumnsChange}
            />
          )}
          
          <button
            onClick={() => setIsAddTradeModalOpen(true)}
            className="items-center space-x-1 hidden lg:flex lg:space-x-2 px-2 lg:px-2 py-1.5 lg:py-2 bg-blue-500 text-white text-sm lg:text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} className="" />
            <span className="text-sm">Add Trade</span>
          </button>

          <button
            onClick={() => setIsAddTradeModalOpen(true)}
            className="items-center space-x-1 sm:hidden flex  px-2  py-1.5 mr-2 bg-blue-500 text-white text-sm sm:text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus size={10} className="sm:size-6" />
            <span className="text-[12px]">Add Trade</span>
          </button>

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
    </>
  );
};

export default Header;