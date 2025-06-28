import React, { useState } from "react";
import { Plus, X, Grid3X3, Grid2X2, LayoutGrid } from "lucide-react";
import TradingViewChart from "./TradingViewChart";

interface ChartTab {
  id: string;
  symbol: string;
  timeframe: string;
  chartType: "line" | "candlestick";
}

type LayoutType = "single" | "2x2" | "3x1" | "2x2-grid";

const ChartContainer: React.FC = () => {
  const [tabs, setTabs] = useState<ChartTab[]>([
    { id: "1", symbol: "NIFTY", timeframe: "5m", chartType: "candlestick" },
    { id: "2", symbol: "BANKNIFTY", timeframe: "5m", chartType: "candlestick" },
    { id: "3", symbol: "FINNIFTY", timeframe: "5m", chartType: "candlestick" },
    {
      id: "4",
      symbol: "MIDCPNIFTY",
      timeframe: "5m",
      chartType: "candlestick",
    },
  ]);
  const [activeTab, setActiveTab] = useState("1");
  const [layout, setLayout] = useState<LayoutType>("single");

  const addNewTab = () => {
    const newTab: ChartTab = {
      id: Date.now().toString(),
      symbol: "BANKNIFTY",
      timeframe: "5m",
      chartType: "candlestick",
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close the last tab

    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
  };

  const updateTab = (tabId: string, updates: Partial<ChartTab>) => {
    setTabs(
      tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab))
    );
  };

  const getVisibleTabs = () => {
    switch (layout) {
      case "single":
        return tabs.filter((tab) => tab.id === activeTab);
      case "2x2":
        return tabs.slice(0, 2);
      case "3x1":
        return tabs.slice(0, 3);
      case "2x2-grid":
        return tabs.slice(0, 4);
      default:
        return tabs.filter((tab) => tab.id === activeTab);
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case "single":
        return "grid grid-cols-1 gap-1";
      case "2x2":
        return "grid grid-cols-2 gap-1";
      case "3x1":
        return "grid grid-cols-3 gap-1";
      case "2x2-grid":
        return "grid grid-cols-2 grid-rows-2 gap-1";
      default:
        return "grid grid-cols-1 gap-1";
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex-1 flex items-center overflow-x-auto">
          {layout === "single" &&
            tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 px-3 py-2 border-r border-gray-700 cursor-pointer min-w-0 ${
                  activeTab === tab.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-750"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-sm font-medium truncate">
                  {tab.symbol} {tab.timeframe}
                </span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
        </div>

        <div className="flex items-center space-x-1 px-2">
          {/* Layout Options */}
          <div className="flex bg-gray-700 rounded">
            <button
              onClick={() => setLayout("single")}
              className={`p-1 rounded-l ${
                layout === "single"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="Single Chart"
            >
              <div className="w-4 h-4 border border-current"></div>
            </button>
            <button
              onClick={() => setLayout("2x2")}
              className={`p-1 ${
                layout === "2x2"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="2 Charts"
            >
              <Grid2X2 size={16} />
            </button>
            <button
              onClick={() => setLayout("3x1")}
              className={`p-1 ${
                layout === "3x1"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="3 Charts"
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setLayout("2x2-grid")}
              className={`p-1 rounded-r ${
                layout === "2x2-grid"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              title="4 Charts Grid"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={addNewTab}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="Add new chart"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Chart Controls - Only show for single layout */}
      {layout === "single" && tabs.find((tab) => tab.id === activeTab) && (
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <select
              value={tabs.find((tab) => tab.id === activeTab)?.symbol || ""}
              onChange={(e) => updateTab(activeTab, { symbol: e.target.value })}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NIFTY">NIFTY</option>
              <option value="BANKNIFTY">BANKNIFTY</option>
              <option value="FINNIFTY">FINNIFTY</option>
              <option value="MIDCPNIFTY">MIDCPNIFTY</option>
              <option value="SENSEX">SENSEX</option>
            </select>

            <select
              value={tabs.find((tab) => tab.id === activeTab)?.timeframe || ""}
              onChange={(e) =>
                updateTab(activeTab, { timeframe: e.target.value })
              }
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="1d">1D</option>
            </select>

            <div className="flex bg-gray-700 rounded">
              <button
                onClick={() => updateTab(activeTab, { chartType: "line" })}
                className={`px-3 py-1 text-sm rounded-l ${
                  tabs.find((tab) => tab.id === activeTab)?.chartType === "line"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Line
              </button>
              <button
                onClick={() =>
                  updateTab(activeTab, { chartType: "candlestick" })
                }
                className={`px-3 py-1 text-sm rounded-r ${
                  tabs.find((tab) => tab.id === activeTab)?.chartType ===
                  "candlestick"
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Candles
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            Last: <span className="text-white font-medium">24,235.50</span>
            <span className="text-green-400 ml-2">+125.30 (+0.52%)</span>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 p-1 ${getLayoutClasses()}`}>
          {getVisibleTabs().map((tab) => (
            <div key={tab.id} className="relative">
              {layout !== "single" && (
                <div className="absolute top-2 left-2 z-10 bg-gray-800 px-2 py-1 rounded text-xs text-white">
                  {tab.symbol}
                </div>
              )}
              <TradingViewChart
                symbol={tab.symbol}
                timeframe={tab.timeframe}
                chartType={tab.chartType}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;