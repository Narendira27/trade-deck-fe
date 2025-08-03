/** eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { init, dispose, Chart } from "klinecharts";
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

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  tradeId,
  chartType = "candlestick",
  chartData,
  isLoading,
  onRefreshData,
}) => {
  const { trades, optionValues } = useStore();
  const trade = trades.find((t) => t.id === tradeId);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const priceLinesRef = useRef<Record<string, any>>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const chartPositionRef = useRef<{ x: number; y: number } | null>(null);

  const [cursor, setCursor] = useState("default");

  const isDraggingRef = useRef(false);
  const draggingLineTypeRef = useRef<"limit" | "sl" | "tp" | null>(null);
  const lastCandleDataRef = useRef<CandlestickData | null>(null);

  const [chartReady, setChartReady] = useState(false);

  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [slPoints, setSlPoints] = useState(5);
  const [tpPoints, setTpPoints] = useState(5);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keys = ["limit", "sl", "tp"] as const;
  type LineType = (typeof keys)[number];

  const debouncedUpdatePrice = (type: LineType, price: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      updatePriceOnBackend(type, price);
    }, 200);
  };

  const updatePriceOnBackend = async (type: LineType, price: number) => {
    if (!trade) return;

    try {
      const DATA: {
        entryPrice: number;
        stopLossPremium: number;
        takeProfitPremium: number;
        stopLossPoints: number;
        takeProfitPoints: number;
      } = {
        entryPrice: trade.entryPrice,
        stopLossPremium: trade.stopLossPremium,
        takeProfitPremium: trade.takeProfitPremium,
        stopLossPoints: trade.stopLossPoints,
        takeProfitPoints: trade.takeProfitPoints,
      };

      if (type === "limit") {
        if (trade.entrySide === "SELL") {
          DATA.stopLossPoints = parseFloat(
            (trade.stopLossPremium - price).toFixed(2)
          );
          DATA.takeProfitPoints = parseFloat(
            (price - trade.takeProfitPremium).toFixed(2)
          );
        }

        if (trade.entrySide === "BUY") {
          DATA.stopLossPoints = parseFloat(
            (price - trade.stopLossPremium).toFixed(2)
          );
          DATA.takeProfitPoints = parseFloat(
            (trade.takeProfitPremium - price).toFixed(2)
          );
        }

        DATA.entryPrice = parseFloat(price.toFixed(2));
      } else if (type === "sl") {
        if (trade.entrySide === "BUY") {
          DATA.stopLossPoints = parseFloat(
            (trade.entryPrice - price).toFixed(2)
          );
          if (price >= trade.entryPrice) {
            toast.error("SL price should be less than the limit price");
            return;
          }
        }
        if (trade.entrySide === "SELL") {
          DATA.stopLossPoints = parseFloat(
            (price - trade.entryPrice).toFixed(2)
          );
          if (price <= trade.entryPrice) {
            toast.error("SL price should be greater than the limit price");
            return;
          }
        }
        DATA.stopLossPremium = parseFloat(price.toFixed(2));
      } else if (type === "tp") {
        if (trade.entrySide === "BUY") {
          DATA.takeProfitPoints = parseFloat(
            (price - trade.entryPrice).toFixed(2)
          );
          if (price <= trade.entryPrice) {
            toast.error("TP price should be greater than the limit price");
            return;
          }
        }
        if (trade.entrySide === "SELL") {
          DATA.takeProfitPoints = parseFloat(
            (trade.entryPrice - price).toFixed(2)
          );
          if (price >= trade.entryPrice) {
            toast.error("SL price should be greater than the limit price");
            return;
          }
        }
        DATA.takeProfitPremium = parseFloat(price.toFixed(2));
      }
      const token = cookies.get("auth");

      await axios.put(API_URL + "/user/tradeInfo", DATA, {
        headers: { Authorization: "Bearer " + token },
        params: { id: trade.id },
      });

      toast.success(`${type.toUpperCase()} price updated`);
    } catch (error) {
      console.error(error);
      toast.error("Error updating price");
    }
  };

  const transformDataForChartType = (rawData: CandlestickData[]) => {
    const newData = removeIfNotEndingWith59(rawData);
    return newData.map((candle) => ({
      timestamp: candle.time * 1000, // Convert to milliseconds for klinecharts
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: 0, // Default volume
    }));
  };

  const removePriceLines = () => {
    if (chartRef.current) {
      keys.forEach((key) => {
        if (priceLinesRef.current[key]) {
          chartRef.current?.removeOverlay(priceLinesRef.current[key]);
          priceLinesRef.current[key] = null;
        }
      });
    }
  };

  const createPriceLines = (prices: {
    limit: number;
    sl: number;
    tp: number;
  }) => {
    if (!chartRef.current) return;

    removePriceLines();

    if (trade?.entryType === "UNDEFINED" && orderType === "market") {
      return;
    }

    keys.forEach((key) => {
      const price = prices[key];
      if (typeof price !== "number" || isNaN(price)) {
        console.warn(`Invalid price for ${key}:`, price);
        return;
      }

      const lineColor = key === "sl" ? "#ef5350" : key === "tp" ? "#26a69a" : "#2962FF";
      
      const overlay = {
        name: 'priceLine',
        id: `${key}_line`,
        points: [{ value: price }],
        styles: {
          line: {
            color: lineColor,
            size: 2,
          },
        },
        onDrawEnd: () => {
          // Handle draw end if needed
        }
      };

      priceLinesRef.current[key] = chartRef.current?.addOverlay(overlay);
    });
  };

  // Live data updates
  useEffect(() => {
    if (!chartReady) return;

    const option = optionValues.find((t) => t.id === tradeId);
    if (!option?.lowestCombinedPremium) return;

    const liveValue = option.lowestCombinedPremium;
    const candleTime = getISTAlignedTimeInSeconds();

    if (chartType === "candlestick") {
      if (
        !lastCandleDataRef.current ||
        lastCandleDataRef.current.time !== candleTime
      ) {
        lastCandleDataRef.current = {
          time: candleTime,
          open: liveValue,
          high: liveValue,
          low: liveValue,
          close: liveValue,
        };
      } else {
        lastCandleDataRef.current.high = Math.max(
          lastCandleDataRef.current.high,
          liveValue
        );
        lastCandleDataRef.current.low = Math.min(
          lastCandleDataRef.current.low,
          liveValue
        );
        lastCandleDataRef.current.close = liveValue;
      }

      const klineData = {
        timestamp: candleTime * 1000,
        open: lastCandleDataRef.current.open,
        high: lastCandleDataRef.current.high,
        low: lastCandleDataRef.current.low,
        close: lastCandleDataRef.current.close,
        volume: 0,
      };

      chartRef.current?.updateData(klineData);
    }
  }, [chartReady, optionValues, tradeId, chartType]);

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let chart: Chart | null = null;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          chart = init(container, {
            layout: [
              {
                type: 'candle',
                options: {
                  grid: {
                    show: true,
                    horizontal: {
                      show: true,
                      color: '#374151',
                    },
                    vertical: {
                      show: true,
                      color: '#374151',
                    },
                  },
                  candle: {
                    type: chartType === 'line' ? 'area' : 'candle_solid',
                    bar: {
                      upColor: '#10b981',
                      downColor: '#ef4444',
                      noChangeColor: '#888888',
                    },
                    area: {
                      lineColor: '#3b82f6',
                      fillColor: [{
                        offset: 0,
                        color: 'rgba(59, 130, 246, 0.4)'
                      }, {
                        offset: 1,
                        color: 'rgba(59, 130, 246, 0.04)'
                      }]
                    },
                  },
                  xAxis: {
                    show: true,
                    axisLine: {
                      show: true,
                      color: '#374151',
                    },
                    tickLine: {
                      show: true,
                      color: '#374151',
                    },
                    tickText: {
                      show: true,
                      color: '#d1d5db',
                    },
                  },
                  yAxis: {
                    show: true,
                    position: 'right',
                    axisLine: {
                      show: true,
                      color: '#374151',
                    },
                    tickLine: {
                      show: true,
                      color: '#374151',
                    },
                    tickText: {
                      show: true,
                      color: '#d1d5db',
                    },
                  },
                  crosshair: {
                    show: true,
                    horizontal: {
                      show: true,
                      line: {
                        color: '#374151',
                        style: 'dash',
                      },
                    },
                    vertical: {
                      show: true,
                      line: {
                        color: '#374151',
                        style: 'dash',
                      },
                    },
                  },
                },
              },
            ],
            styles: {
              layout: {
                backgroundColor: '#1f2937',
                textColor: '#d1d5db',
              },
            },
          });

          if (!chart) {
            console.error("Failed to create chart instance");
            return;
          }

          chartRef.current = chart;
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
  }, [chartContainerRef.current]);

  // Update chart when data or chart type changes
  useEffect(() => {
    if (!chartRef.current || !chartReady || !chartData.length) return;

    // Transform data for klinecharts
    const transformedData = transformDataForChartType(chartData);

    // Clear existing data and add new data
    chartRef.current.clearData();
    chartRef.current.applyNewData(transformedData);

    // Update chart type if needed
    if (chartType === 'line') {
      chartRef.current.setStyles({
        candle: {
          type: 'area'
        }
      });
    } else {
      chartRef.current.setStyles({
        candle: {
          type: 'candle_solid'
        }
      });
    }
  }, [chartData, chartType, chartReady]);

  useEffect(() => {
    if (!chartReady) return;
    const container = chartContainerRef.current;
    if (!container || !chartRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;

      let nearest: LineType | null = null;
      let minDistance = Infinity;

      keys.forEach((key) => {
        const line = priceLinesRef.current[key];
        if (!line) return;
        // For klinecharts, we need to calculate the coordinate differently
        // This is a simplified approach - you might need to adjust based on klinecharts API
        const dist = Math.abs(y - 100); // Placeholder calculation
        if (dist < 10 && dist < minDistance) {
          nearest = key;
          minDistance = dist;
        }
      });

      if (isDraggingRef.current && draggingLineTypeRef.current) {
        // Handle dragging logic for klinecharts
        setCursor("grabbing");
      } else {
        setCursor(nearest ? "grab" : "default");
        draggingLineTypeRef.current = nearest;
      }
    };

    const handleMouseDown = () => {
      if (!draggingLineTypeRef.current) return;

      const lineType = draggingLineTypeRef.current;
      let canDrag = false;

      if (!trade || trade.entryType === "UNDEFINED") canDrag = true;
      else if (trade.entryType === "LIMIT" && !trade.entryTriggered)
        canDrag = true;
      else if (
        ["LIMIT", "MARKET"].includes(trade.entryType) &&
        trade.entryTriggered
      )
        canDrag = lineType === "sl" || lineType === "tp";

      if (!canDrag) {
        setCursor("not-allowed");
        return;
      }

      isDraggingRef.current = true;
      setCursor("grabbing");
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        const lineType = draggingLineTypeRef.current;

        if (lineType) {
          // Get updated price from klinecharts overlay
          // This is a placeholder - you'll need to implement based on klinecharts API
          const updatedPrice = 100; // Placeholder

          if (updatedPrice !== undefined && updatedPrice !== null) {
            debouncedUpdatePrice(lineType, updatedPrice);
          }
        }
      }
      isDraggingRef.current = false;
      setCursor("default");
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
    };
  }, [trade, orderType, chartReady, chartType]);

  useEffect(() => {
    if (!chartData.length || !trade || chartData.length === 0) return;

    // Get the last price with proper fallback handling
    let lastPrice = 0; // Default fallback value

    if (chartData.length > 0) {
      const lastDataPoint = chartData[chartData.length - 1];
      lastPrice = typeof lastDataPoint.close === "number" ? lastDataPoint.close : 0;
    }

    const getUpdatedPriceLastPrice = () => {
      if (trade.entrySide === "BUY") {
        return {
          limit: lastPrice,
          sl: lastPrice - 3,
          tp: lastPrice + 3,
        };
      }
      if (trade.entrySide === "SELL") {
        return {
          limit: lastPrice,
          sl: lastPrice + 3,
          tp: lastPrice - 3,
        };
      }
    };

    const updatedLines = {
      limit:
        trade.entryPrice && trade.entryPrice !== 0
          ? trade.entryPrice
          : getUpdatedPriceLastPrice()?.limit || lastPrice,
      sl:
        trade.stopLossPremium && trade.stopLossPremium !== 0
          ? trade.stopLossPremium
          : getUpdatedPriceLastPrice()?.sl || lastPrice,
      tp:
        trade.takeProfitPremium && trade.takeProfitPremium !== 0
          ? trade.takeProfitPremium
          : getUpdatedPriceLastPrice()?.tp || lastPrice,
    };

    createPriceLines(updatedLines);
  }, [trade, orderType, chartType, chartData]);

  const placeOrder = async () => {
    if (!trade) return;

    if (!qty) {
      toast.warning("Qty is required");
      return;
    }

    const token = cookies.get("auth");

    let limitPrice = priceLinesRef.current.limit?.options?.price;
    let slPrice = priceLinesRef.current.sl?.options?.price;
    let tpPrice = priceLinesRef.current.tp?.options?.price;

    console.log(priceLinesRef.current);
    if ((!limitPrice || !slPrice || !tpPrice) && orderType === "limit") return;

    if (orderType === "market") {
      await axios.put(
        API_URL + "/user/tradeInfo",
        {
          entryType: "MARKET",
          stopLossPoints: slPoints,
          takeProfitPoints: tpPoints,
          qty,
          currentQty: qty,
        },
        {
          headers: { Authorization: "Bearer " + token },
          params: { id: trade.id },
        }
      );
    }

    if (orderType === "limit" && limitPrice && slPrice && tpPrice) {
      limitPrice = parseFloat(limitPrice.toFixed(2));
      slPrice = parseFloat(slPrice.toFixed(2));
      tpPrice = parseFloat(tpPrice.toFixed(2));
      let getTpPoints;
      let getSlPoints;
      if (trade.entrySide === "SELL") {
        if (trade.takeProfitPremium >= trade.entryPrice) {
          toast.warning("take profit cannot be greater than the limit price");
          return;
        }
        if (trade.stopLossPremium <= trade.entryPrice) {
          toast.warning("stopLoss cannot be less than the limit price");
          return;
        }
        getTpPoints = limitPrice - tpPrice;
        getSlPoints = slPrice - limitPrice;
      }
      if (trade.entrySide === "BUY") {
        if (trade.takeProfitPremium <= trade.entryPrice) {
          toast.warning("take profit cannot be less then the limit price");
          return;
        }
        if (trade.stopLossPremium >= trade.entryPrice) {
          toast.warning("stop loss cannot be greater than the limit price");
        }
        getTpPoints = tpPrice - limitPrice;
        getSlPoints = limitPrice - slPrice;
      }
      await axios.put(
        API_URL + "/user/tradeInfo",
        {
          entryType: "LIMIT",
          qty,
          currentQty: qty,
          entryPrice: limitPrice,
          stopLossPremium: slPrice,
          takeProfitPremium: tpPrice,
          stopLossPoints: getSlPoints,
          takeProfitPoints: getTpPoints,
        },
        {
          headers: { Authorization: "Bearer " + token },
          params: { id: trade.id },
        }
      );
    }

    toast.success("Order placed successfully");
  };

  const scrollDownside = () => {
    if (!chartRef.current) return;
    // Implement zoom out functionality for klinecharts
    chartRef.current.zoomAtCoordinate(0.9, { x: 0, y: 0 });
  };

  const scrollUpside = () => {
    if (!chartRef.current) return;
    // Implement zoom in functionality for klinecharts
    chartRef.current.zoomAtCoordinate(1.1, { x: 0, y: 0 });
  };

  const resetMargins = () => {
    if (!chartRef.current) return;
    // Reset zoom for klinecharts
    chartRef.current.zoomAtCoordinate(1.0, { x: 0, y: 0 });
  };

  if (!trade)
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Trade not found
      </div>
    );

  if (isLoading && !chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p>No chart data available</p>
          <button
            onClick={onRefreshData}
            className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full relative"
      style={{ cursor }}
    >
      <div className="z-20 absolute top-10 right-20 flex space-x-2">
        <button
          onClick={scrollUpside}
          className="px-1 py-1 text-xs cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
        >
          ↑
        </button>
        <button
          onClick={scrollDownside}
          className="px-1 py-1 text-xs cursor-pointer bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ↓
        </button>
        <button
          onClick={resetMargins}
          className="text-xs px-1 py-1 cursor-pointer bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Reset
        </button>
      </div>
      {trade.entryType === "UNDEFINED" && (
        <div className="absolute top-10 left-2 bg-gray-700 border border-gray-600 p-2 rounded-xl z-20 text-white text-xs">
          <div className="mb-2">
            <label className="block mb-1">Qty:</label>
            <input
              className="border rounded px-1 py-0.5 w-16 bg-gray-800 text-white"
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1">
              <input
                type="radio"
                checked={orderType === "limit"}
                onChange={() => setOrderType("limit")}
                className="mr-1"
              />
              Limit
            </label>
            <label className="block">
              <input
                type="radio"
                checked={orderType === "market"}
                onChange={() => setOrderType("market")}
                className="mr-1"
              />
              Market
            </label>
          </div>

          {orderType === "market" && (
            <div className="mb-2">
              <div className="mb-1">
                <label className="block text-xs">SL (pts):</label>
                <input
                  type="number"
                  value={slPoints}
                  onChange={(e) => setSlPoints(Number(e.target.value))}
                  className="w-12 px-1 py-0.5 border border-gray-500 bg-gray-800 text-white rounded"
                />
              </div>
              <div className="mb-1">
                <label className="block text-xs">TP (pts):</label>
                <input
                  type="number"
                  value={tpPoints}
                  onChange={(e) => setTpPoints(Number(e.target.value))}
                  className="w-12 px-1 py-0.5 border border-gray-500 bg-gray-800 text-white rounded"
                />
              </div>
            </div>
          )}

          <button
            onClick={placeOrder}
            className="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-medium w-full"
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
};

function removeIfNotEndingWith59(chartData: CandlestickData[]): CandlestickData[] {
  if (chartData.length === 0) return chartData;

  const last = chartData[chartData.length - 1];
  const timestamp = typeof last.time === "number" ? last.time : undefined;

  if (timestamp !== undefined) {
    const lastSeconds = timestamp % 60;

    if (lastSeconds !== 59) {
      chartData.pop(); // Remove last item
      console.log("removed");
    }
  }

  return chartData;
}

const getISTAlignedTimeInSeconds = () => {
  const istOffsetMinutes = 5.5 * 60;
  const currentTimeIST = Date.now() + istOffsetMinutes * 60 * 1000 + 50;
  const currentTimeGMTSeconds = Math.floor(currentTimeIST / 1000);
  return currentTimeGMTSeconds - (currentTimeGMTSeconds % 60);
};

export default TradingViewChart;