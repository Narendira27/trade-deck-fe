import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface Position {
  id: string;
  optionName: string;
  price: number;
  mtm: number;
  quantity: number;
  type: 'CE' | 'PE';
}

const PositionTracker: React.FC = () => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Position;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Mock data - replace with real data from your store
  const [positions] = useState<Position[]>([
    {
      id: '1',
      optionName: 'NIFTY 25000 CE',
      price: 125.50,
      mtm: 1250,
      quantity: 50,
      type: 'CE',
    },
    {
      id: '2',
      optionName: 'NIFTY 24800 PE',
      price: 89.75,
      mtm: -450,
      quantity: 25,
      type: 'PE',
    },
    {
      id: '3',
      optionName: 'BANKNIFTY 52000 CE',
      price: 245.25,
      mtm: 875,
      quantity: 15,
      type: 'CE',
    },
    {
      id: '4',
      optionName: 'BANKNIFTY 51500 PE',
      price: 156.80,
      mtm: -320,
      quantity: 20,
      type: 'PE',
    },
    {
      id: '5',
      optionName: 'FINNIFTY 23500 CE',
      price: 78.90,
      mtm: 560,
      quantity: 40,
      type: 'CE',
    },
    {
      id: '6',
      optionName: 'MIDCPNIFTY 12000 PE',
      price: 45.30,
      mtm: -180,
      quantity: 30,
      type: 'PE',
    },
    {
      id: '7',
      optionName: 'SENSEX 72000 CE',
      price: 189.60,
      mtm: 720,
      quantity: 10,
      type: 'CE',
    },
  ]);

  const handleSort = (key: keyof Position) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPositions = React.useMemo(() => {
    if (!sortConfig) return positions;

    return [...positions].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [positions, sortConfig]);

  const getSortIcon = (columnKey: keyof Position) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown size={14} className="text-gray-500" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-blue-400" />
    ) : (
      <ArrowDown size={14} className="text-blue-400" />
    );
  };

  const totalMtm = positions.reduce((sum, pos) => sum + pos.mtm, 0);

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Live Positions</h3>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total MTM</p>
            <p
              className={`text-lg font-semibold ${
                totalMtm >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatCurrency(totalMtm)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <div className="grid grid-cols-4 gap-2 p-3">
            <button
              onClick={() => handleSort('optionName')}
              className="flex items-center space-x-1 text-left hover:text-white transition-colors text-xs font-medium text-gray-300"
            >
              <span>Option</span>
              {getSortIcon('optionName')}
            </button>
            <button
              onClick={() => handleSort('price')}
              className="flex items-center justify-end space-x-1 hover:text-white transition-colors text-xs font-medium text-gray-300"
            >
              <span>Price</span>
              {getSortIcon('price')}
            </button>
            <button
              onClick={() => handleSort('quantity')}
              className="flex items-center justify-end space-x-1 hover:text-white transition-colors text-xs font-medium text-gray-300"
            >
              <span>Qty</span>
              {getSortIcon('quantity')}
            </button>
            <button
              onClick={() => handleSort('mtm')}
              className="flex items-center justify-end space-x-1 hover:text-white transition-colors text-xs font-medium text-gray-300"
            >
              <span>MTM</span>
              {getSortIcon('mtm')}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {sortedPositions.map((position) => (
              <div
                key={position.id}
                className="grid grid-cols-4 gap-2 p-3 bg-gray-800 rounded-md hover:bg-gray-750 transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-white font-medium truncate">
                    {position.optionName}
                  </span>
                  <span
                    className={`text-xs ${
                      position.type === 'CE' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {position.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white font-medium">
                    {formatNumber(position.price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-white">{position.quantity}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-medium ${
                      position.mtm >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatCurrency(position.mtm)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionTracker;