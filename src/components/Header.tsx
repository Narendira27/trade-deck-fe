import React from 'react';
import { BarChart2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white py-3 px-4 sm:py-4 sm:px-6 flex items-center justify-between border-b border-gray-800">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <BarChart2 className="text-blue-500" size={20} />
        <h1 className="text-lg sm:text-xl font-semibold">TradeDeck</h1>
      </div>
    </header>
  );
};

export default Header;