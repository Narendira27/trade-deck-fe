import React from "react";

const TableHeader: React.FC = () => {
  return (
    <thead className="bg-gray-800">
      <tr>
        <th className="px-4 py-3 text-sm font-medium text-left text-gray-300 border-b border-gray-700"></th>
        <th className="px-4 py-3 text-sm font-medium text-left text-gray-300 border-b border-gray-700">
          Index
        </th>

        <th className="px-4 py-3 text-sm font-medium text-left text-gray-300 border-b border-gray-700">
          LTP Spot
        </th>
        <th className="px-4 py-3 text-sm font-medium text-left text-gray-300 border-b border-gray-700">
          Leg Count
        </th>
        <th className="px-4 py-3 text-sm font-medium text-left text-gray-300 border-b border-gray-700">
          Expiry
        </th>
        <th className="px-4 py-3 text-sm font-medium text-left text-gray-300 border-b border-gray-700">
          LTP Range
        </th>
        <th className="px-4 py-3 text-sm font-medium text-left text-gray-300 border-b border-gray-700">
          Actions
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;
