/** eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { init, dispose } from "klinecharts";
import { X, TrendingUp, TrendingDown, Target } from "lucide-react";
import useStore from "../../store/store";
import { toast } from "sonner";
import { API_URL } from "../../config/config";
import axios from "axios";
import cookies from "js-cookie";

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  chartType: "line" | "candlestick";
  tradeId: string;
  chartData: any[];
  isLoading: boolean;
  onRefreshData: () => void;
}

interface OrderValues {
  limitPrice: number;
  takeProfit: number;
  stopLoss: number;
  currentPrice: number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  tradeId,
  chartType = "candlestick",
  symbol,
  isLoading,
  onRefreshData,
}) => {
  const { trades, optionValues } = useStore();
  const trade = trades.find((t) => t.id === tradeId);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [orderValues, setOrderValues] = useState<OrderValues>({
    limitPrice: 0,
    takeProfit: 0,
    stopLoss: 0,
    currentPrice: 0,
  });
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState(1);

  const overlayRefs = useRef<{
    limitPrice?: any;
    takeProfit?: any;
    stopLoss?: any;
  }>({});

  const [chartReady, setChartReady] = useState(false);

  // Generate random chart data
  const generateRandomData = () => {
    const data = Array.from({ length: 200 }, (_, i) => {
      const base = 50 + i * 0.1;
      const open = base + (Math.random() - 0.5) * 2;
      const close = open + (Math.random() - 0.5) * 2;
      const high = Math.max(open, close) + Math.random() * 1.2;
      const low = Math.min(open, close) - Math.random() * 1.2;
      return {
        timestamp: Date.now() + i * 60000,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.random() * 1000,
      };
    });
    return data;
  };

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let chart: any = null;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          chart = init(container);
          chartRef.current = chart;

          if (!chart) {
            console.error("Failed to create chart instance");
            return;
          }

          // Disable right-click context menu
          container.addEventListener("contextmenu", (e) => {
            e.preventDefault();
          });

          // Apply chart styles
          chart.setStyles({
            grid: {
              show: false,
            },
            xAxis: {
              show: true,
              axisLine: {
                show: true,
                color: "#4a5568",
                size: 1,
              },
              tickText: {
                show: true,
                color: "#a0aec0",
                size: 12,
                weight: "normal",
              },
              tickLine: {
                show: true,
                color: "#4a5568",
                size: 1,
                length: 3,
              },
            },
            yAxis: {
              show: true,
              axisLine: {
                show: true,
                color: "#4a5568",
                size: 1,
              },
              tickText: {
                show: true,
                color: "#a0aec0",
                size: 12,
                weight: "normal",
              },
              tickLine: {
                show: true,
                color: "#4a5568",
                size: 1,
                length: 3,
              },
            },
            crosshair: {
              show: true,
              horizontal: {
                show: true,
                line: {
                  show: true,
                  style: "dash",
                  dashValue: [4, 2],
                  size: 1,
                  color: "#718096",
                },
                text: {
                  show: true,
                  color: "#ffffff",
                  size: 12,
                  backgroundColor: "#2d3748",
                  borderColor: "#4a5568",
                  borderSize: 1,
                  borderRadius: 2,
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 2,
                  paddingBottom: 2,
                },
              },
              vertical: {
                show: true,
                line: {
                  show: true,
                  style: "dash",
                  dashValue: [4, 2],
                  size: 1,
                  color: "#718096",
                },
                text: {
                  show: true,
                  color: "#ffffff",
                  size: 12,
                  backgroundColor: "#2d3748",
                  borderColor: "#4a5568",
                  borderSize: 1,
                  borderRadius: 2,
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 2,
                  paddingBottom: 2,
                },
              },
            },
            separator: {
              size: 1,
              color: "#4a5568",
              fill: true,
              activeBackgroundColor: "#2d3748",
            },
            candle: {
              type: chartType === "line" ? "area" : "candle_solid",
              area: {
                lineSize: 2,
                lineColor: "#4299e1",
                smooth: true,
                value: "close",
                backgroundColor: [
                  {
                    offset: 0,
                    color: "rgba(255, 255, 255, 0)",
                  },
                  {
                    offset: 1,
                    color: "rgba(255, 255, 255, 0)",
                  },
                ],
              },
              bar: {
                upColor: "#10b981",
                downColor: "#ef4444",
                noChangeColor: "#888888",
              },
            },
            indicator: {
              ohlc: {
                show: true,
                upColor: "#48bb78",
                downColor: "#f56565",
                noChangeColor: "#a0aec0",
              },
              lastValueMark: {
                show: true,
                text: {
                  show: true,
                  color: "#ffffff",
                  size: 12,
                  weight: "normal",
                  backgroundColor: "#4299e1",
                  borderColor: "#2b6cb0",
                  borderSize: 1,
                  borderRadius: 2,
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 2,
                  paddingBottom: 2,
                },
              },
            },
          });

          // Generate and load data
          const data = generateRandomData();
          const currentPrice = data[data.length - 1].close;

          chart.setSymbol({ ticker: symbol || "BANKNIFTY-100" });
          chart.setPeriod({ span: 1, type: "minute" });
          chart.setDataLoader({
            getBars: ({ callback }) => {
              callback(data);
            },
          });

          // Create overlays if trade exists
          if (trade && trade.entryType !== "UNDEFINED") {
            createOverlays(chart, currentPrice);
          }

          setChartReady(true);

          const resizeChart = () => {
            if (chartRef.current && chartContainerRef.current) {
              const rect = chartContainerRef.current.getBoundingClientRect();
              chartRef.current.resize(rect.width, rect.height);
            }
          };

          resizeObserverRef.current = new ResizeObserver(() =>
            requestAnimationFrame(resizeChart)
          );
          resizeObserverRef.current.observe(container);

          setTimeout(resizeChart, 100);
          observer.unobserve(container);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      resizeObserverRef.current?.disconnect();

      if (chart) {
        try {
          dispose(container);
        } catch (error) {
          console.warn("Chart disposal error:", error);
        }
        chart = null;
      }

      chartRef.current = null;
      setChartReady(false);
    };
  }, [chartContainerRef.current, symbol, chartType]);

  const createOverlays = (chart: any, currentPrice: number) => {
    if (!trade) return;

    const limitPrice = trade.entryPrice || currentPrice;
    const takeProfit = trade.takeProfitPremium || currentPrice + 1;
    const stopLoss = trade.stopLossPremium || currentPrice - 1;

    // Create Take Profit overlay
    const tpOverlay = chart.createOverlay({
      name: "priceLine",
      paneId: "candle_pane",
      points: [{ value: takeProfit }],
      styles: {
        line: { color: "#41e40f", size: 2 },
        text: {
          show: true,
          text: "TP",
          color: "#ffffff",
          size: 12,
          backgroundColor: "#41e40f",
          borderColor: "#2d5016",
          borderSize: 1,
          borderRadius: 4,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 3,
          paddingBottom: 3,
        },
      },
      onDrawEnd: ({ overlay }) => {
        overlayRefs.current.takeProfit = overlay;
      },
    });

    // Create Limit Price overlay
    const limitOverlay = chart.createOverlay({
      name: "priceLine",
      paneId: "candle_pane",
      points: [{ value: limitPrice }],
      styles: {
        line: { color: "#2558a5", size: 2 },
        text: {
          show: true,
          text: "LIMIT",
          color: "#ffffff",
          size: 12,
          backgroundColor: "#2558a5",
          borderColor: "#1a3a5c",
          borderSize: 1,
          borderRadius: 4,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 3,
          paddingBottom: 3,
        },
      },
      onDrawEnd: ({ overlay }) => {
        overlayRefs.current.limitPrice = overlay;
      },
    });

    // Create Stop Loss overlay
    const slOverlay = chart.createOverlay({
      name: "priceLine",
      paneId: "candle_pane",
      points: [{ value: stopLoss }],
      styles: {
        line: { color: "#eb2b2b", size: 2 },
        text: {
          show: true,
          text: "SL",
          color: "#ffffff",
          size: 12,
          backgroundColor: "#eb2b2b",
          borderColor: "#7a1a1a",
          borderSize: 1,
          borderRadius: 4,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 3,
          paddingBottom: 3,
        },
      },
      onDrawEnd: ({ overlay }) => {
        overlayRefs.current.stopLoss = overlay;
      },
    });

    // Store overlay references
    overlayRefs.current = {
      takeProfit: tpOverlay,
      limitPrice: limitOverlay,
      stopLoss: slOverlay,
    };

    // Set initial order values
    setOrderValues({
      limitPrice: limitPrice,
      takeProfit: takeProfit,
      stopLoss: stopLoss,
      currentPrice: currentPrice,
    });
  };

  const updateOrderValues = () => {
    if (!chartRef.current) return;

    let limitPrice = orderValues.limitPrice;
    let takeProfit = orderValues.takeProfit;
    let stopLoss = orderValues.stopLoss;

    // Get current values from overlay references
    if (overlayRefs.current.limitPrice?.points?.[0]?.value) {
      limitPrice = overlayRefs.current.limitPrice.points[0].value;
    }
    if (overlayRefs.current.takeProfit?.points?.[0]?.value) {
      takeProfit = overlayRefs.current.takeProfit.points[0].value;
    }
    if (overlayRefs.current.stopLoss?.points?.[0]?.value) {
      stopLoss = overlayRefs.current.stopLoss.points[0].value;
    }

    setOrderValues((prev) => ({
      ...prev,
      limitPrice: parseFloat(limitPrice.toFixed(2)),
      takeProfit: parseFloat(takeProfit.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
    }));
  };

  const handlePlaceOrder = async () => {
    if (!trade) return;

    updateOrderValues();

    const orderData = {
      type: orderType,
      symbol: symbol,
      quantity,
      limitPrice: orderValues.limitPrice,
      takeProfit: orderValues.takeProfit,
      stopLoss: orderValues.stopLoss,
      currentPrice: orderValues.currentPrice,
    };

    try {
      const token = cookies.get("auth");
      await axios.put(
        API_URL + "/user/tradeInfo",
        {
          entryType: "LIMIT",
          qty: quantity,
          currentQty: quantity,
          entryPrice: orderValues.limitPrice,
          stopLossPremium: orderValues.stopLoss,
          takeProfitPremium: orderValues.takeProfit,
          stopLossPoints: Math.abs(
            orderValues.limitPrice - orderValues.stopLoss
          ),
          takeProfitPoints: Math.abs(
            orderValues.takeProfit - orderValues.limitPrice
          ),
        },
        {
          headers: { Authorization: "Bearer " + token },
          params: { id: trade.id },
        }
      );

      toast.success("Order placed successfully");
      setShowOrderPanel(false);
    } catch (error) {
      console.error(error);
      toast.error("Error placing order");
    }
  };

  // if (!trade) {
  //   return (
  //     <div className="flex items-center justify-center h-full text-gray-400">
  //       Trade not found
  //     </div>
  //   );
  // }

  if (isLoading && !chartReady) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gray-900">
      <div
        ref={chartContainerRef}
        className="w-full h-full border border-gray-400"
      />

      {/* Order Panel Toggle Button
      {trade.entryType === "UNDEFINED" && (
        <button
          onClick={() => {
            updateOrderValues();
            setShowOrderPanel(true);
          }}
          className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow-lg transition-colors duration-200 flex items-center gap-2 z-10 text-xs"
        >
          <Target size={14} />
          Place Order
        </button>
      )} */}
      {/* Order Panel Overlay */}
      {showOrderPanel && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Place Order</h2>
              <button
                onClick={() => setShowOrderPanel(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderType("BUY")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                      orderType === "BUY"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <TrendingUp size={18} />
                    BUY
                  </button>
                  <button
                    onClick={() => setOrderType("SELL")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                      orderType === "SELL"
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <TrendingDown size={18} />
                    SELL
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              {/* Current Price */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Current Price</div>
                <div className="text-lg font-semibold text-gray-800">
                  ₹{orderValues.currentPrice.toFixed(2)}
                </div>
              </div>

              {/* Limit Price */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  Limit Price
                </div>
                <div className="text-lg font-semibold text-blue-800">
                  ₹{orderValues.limitPrice.toFixed(2)}
                </div>
              </div>

              {/* Take Profit */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  Take Profit
                </div>
                <div className="text-lg font-semibold text-green-800">
                  ₹{orderValues.takeProfit.toFixed(2)}
                </div>
              </div>

              {/* Stop Loss */}
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  Stop Loss
                </div>
                <div className="text-lg font-semibold text-red-800">
                  ₹{orderValues.stopLoss.toFixed(2)}
                </div>
              </div>

              {/* Risk/Reward */}
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-700">Risk/Reward Ratio</div>
                <div className="text-lg font-semibold text-yellow-800">
                  1:
                  {(
                    (orderValues.takeProfit - orderValues.limitPrice) /
                    Math.abs(orderValues.limitPrice - orderValues.stopLoss)
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOrderPanel(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceOrder}
                className={`flex-1 py-2 px-4 rounded-lg text-white transition-colors duration-200 ${
                  orderType === "BUY"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Place {orderType} Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
