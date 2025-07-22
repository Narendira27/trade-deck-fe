import React, { useState } from "react";
import {
  BarChart2,
  Plus,
  Menu,
  Shield,
  Filter,
  TrendingUp,
  Power,
} from "lucide-react";
import ColumnManager, { type Column } from "./TradeTable/ColumnManager";
import AddTradeModal from "./modals/AddTradeModal";
import DraggableBoxColumnManager from "./DraggableBoxColumnManager";
import PortfolioModal from "./modals/PortfolioModal";
import FilterModal from "./modals/FilterModal";
import useStore from "../store/store";
import { type DraggableBoxColumn } from "../types/draggableBox";
import { API_URL } from "../config/config";
import axios from "axios";
import cookies from "js-cookie";
import { toast } from "sonner";

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [portfolioSL, setPortfolioSL] = useState(0);
  const [portfolioTrail, setPortfolioTrail] = useState(0);
  const [portfolioSLEnabled, setPortfolioSLEnabled] = useState(false);
  const [portfolioTrailEnabled, setPortfolioTrailEnabled] = useState(false);
  const { showDraggable } = useStore();

  const updatePortfolioSettings = async (type: 'sl' | 'trail', enabled: boolean, value?: number) => {
    const auth = cookies.get("auth");
    const data: any = {};
    
    if (type === 'sl') {
      data.portfolioSLEnabled = enabled;
      if (value !== undefined) data.portfolioSL = value;
    } else {
      data.portfolioTrailEnabled = enabled;
      if (value !== undefined) data.portfolioTrail = value;
    }

    try {
      await axios.put(`${API_URL}/user/portfolio-settings`, data, {
        headers: { Authorization: `Bearer ${auth}` }
      });
      toast.success(`Portfolio ${type.toUpperCase()} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error(`Failed to update portfolio ${type.toUpperCase()}`);
    }
  };

  const handleSLToggle = () => {
    const newEnabled = !portfolioSLEnabled;
    setPortfolioSLEnabled(newEnabled);
    updatePortfolioSettings('sl', newEnabled);
  };

  const handleTrailToggle = () => {
    const newEnabled = !portfolioTrailEnabled;
    setPortfolioTrailEnabled(newEnabled);
    updatePortfolioSettings('trail', newEnabled);
  };

  const handleSLChange = (value: number) => {
    setPortfolioSL(value);
    if (portfolioSLEnabled) {
      updatePortfolioSettings('sl', true, value);
    }
  };

  const handleTrailChange = (value: number) => {
    setPortfolioTrail(value);
    if (portfolioTrailEnabled) {
      updatePortfolioSettings('trail', true, value);
    }
  };

  return (
    <>
      <header className="bg-gray-900  text-white py-2 px-2 sm:py-3 sm:px-4 flex items-center justify-between border-b border-gray-800 min-h-[60px]">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <BarChart2 className="text-blue-500 flex-shrink-0" size={20} />
          <h1 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
            TradeDeck
          </h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                portfolioSLEnabled ? 'bg-red-600/20' : 'bg-gray-600/20'
              }`}>
                <button
                  onClick={handleSLToggle}
                  className={`p-1 rounded ${
                    portfolioSLEnabled ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  title={`${portfolioSLEnabled ? 'Disable' : 'Enable'} Portfolio SL`}
                >
                  <Power size={12} />
                </button>
                <Shield size={14} className="text-red-400" />
                <span className="text-xs text-red-400">SL:</span>
                <input
                  type="number"
                  value={portfolioSL}
                  onChange={(e) => handleSLChange(Number(e.target.value))}
                  disabled={!portfolioSLEnabled}
                  className={`w-16 px-1 py-0.5 text-xs border border-gray-600 rounded ${
                    portfolioSLEnabled 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="0"
                />
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                portfolioTrailEnabled ? 'bg-blue-600/20' : 'bg-gray-600/20'
              }`}>
                <button
                  onClick={handleTrailToggle}
                  className={`p-1 rounded ${
                    portfolioTrailEnabled ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  title={`${portfolioTrailEnabled ? 'Disable' : 'Enable'} Portfolio Trail`}
                >
                  <Power size={12} />
                </button>
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-xs text-blue-400">Trail:</span>
                <input
                  type="number"
                  value={portfolioTrail}
                  onChange={(e) => handleTrailChange(Number(e.target.value))}
                  disabled={!portfolioTrailEnabled}
                  className={`w-16 px-1 py-0.5 text-xs border border-gray-600 rounded ${
                    portfolioTrailEnabled 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="0"
                />
              </div>
            </div>

            {showDraggable && (
              <DraggableBoxColumnManager
                columns={draggableColumns}
                onColumnsChange={onDraggableColumnsChange}
              />
            )}

            <ColumnManager
              columns={columns}
              onColumnsChange={onColumnsChange}
            />

            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Filter size={16} />
            </button>

            <button
              onClick={() => setIsAddTradeModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />

            </button>
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="flex lg:hidden items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
            >
              <Filter size={14} />
              <span className="hidden sm:inline">Filter</span>
            </button>

            <button
              onClick={() => setIsAddTradeModalOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
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

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </>
  );
};

export default Header;
