/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from "lightweight-charts";

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  chartType: "line" | "candlestick";
}

const TradingViewChart: React.FC<TradingViewChartProps> = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [priceLines, setPriceLines] = useState({ limit: 100, sl: 95, tp: 105 });
  const [cursor, setCursor] = useState("default");
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [slPoints, setSlPoints] = useState(5);
  const [tpPoints, setTpPoints] = useState(5);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  const isDraggingRef = useRef(false);
  const draggingLineTypeRef = useRef<"limit" | "sl" | "tp" | null>(null);
  const initialDataRef = useRef<CandlestickData[] | null>(null);

  const generateMockData = () => {
    const data: CandlestickData[] = [];
    let basePrice = 24000;
    const now = new Date();
    for (let i = 100; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000);
      const open = basePrice + (Math.random() - 0.5) * 100;
      const high = open + Math.random() * 50;
      const low = open - Math.random() * 50;
      const close = low + Math.random() * (high - low);
      data.push({
        // @ts-expect-error type
        time: Math.floor(time.getTime() / 1000),
        open,
        high,
        low,
        close,
      });
      basePrice = close;
    }
    return data;
  };

  const removePriceLines = () => {
    ["limit", "sl", "tp"].forEach((key) => {
      // @ts-expect-error type
      if (priceLinesRef.current[key]) {
        // @ts-expect-error type
        seriesRef.current?.removePriceLine(priceLinesRef.current[key]);
        // @ts-expect-error type
        delete priceLinesRef.current[key];
      }
    });
  };

  const createPriceLines = (prices: typeof priceLines) => {
    if (!seriesRef.current) return;
    removePriceLines();
    ["limit", "sl", "tp"].forEach((key) => {
      // @ts-expect-error type
      priceLinesRef.current[key] = seriesRef.current!.createPriceLine({
        // @ts-expect-error type
        price: prices[key],
        color: key === "sl" ? "#ef5350" : key === "tp" ? "#26a69a" : "#2962FF",
        lineWidth: 2,
        axisLabelVisible: true,
        // @ts-expect-error type
        title: `${key.toUpperCase()} (${prices[key].toFixed(2)})`,
        lineStyle: 0,
      });
    });
  };

  const resizeChart = () => {
    if (chartRef.current && chartContainerRef.current) {
      const container = chartContainerRef.current;
      const rect = container.getBoundingClientRect();
      chartRef.current.applyOptions({
        width: rect.width,
        height: rect.height,
      });
      chartRef.current.timeScale().fitContent();
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: "#1f2937" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { visible: false, color: "#374151" },
        horzLines: { visible: true, color: "#374151" },
      },
      timeScale: { timeVisible: true },
      crosshair: { mode: 1 },
      handleScale: {
        axisPressedMouseMove: { time: false, price: false },
        mouseWheel: true,
        pinch: false,
      },
      handleScroll: { mouseWheel: true, horzTouchDrag: true },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#10b981",
      wickDownColor: "#ef4444",
      wickUpColor: "#10b981",
    });

    const data = generateMockData();
    initialDataRef.current = data;
    candleSeries.setData(data);
    chart.timeScale().fitContent();

    seriesRef.current = candleSeries;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      let nearest: "limit" | "sl" | "tp" | null = null;
      let minDistance = Infinity;

      for (const key of ["limit", "sl", "tp"] as const) {
        // @ts-expect-error type
        const line = priceLinesRef.current[key];
        if (!line) continue;
        const coord = seriesRef.current?.priceToCoordinate(
          line.options().price
        );
        if (coord === undefined || coord === null) continue;
        const dist = Math.abs(y - coord);
        if (dist < 10 && dist < minDistance) {
          nearest = key;
          minDistance = dist;
        }
      }

      if (isDraggingRef.current && draggingLineTypeRef.current) {
        setCursor("grabbing");
        const newPrice = seriesRef.current?.coordinateToPrice(y);
        if (newPrice !== null && newPrice !== undefined) {
          setPriceLines((prev) => {
            const updated = {
              ...prev,
              [draggingLineTypeRef.current!]: newPrice,
            };
            // @ts-expect-error type
            priceLinesRef.current[draggingLineTypeRef.current!]?.applyOptions({
              price: newPrice,
              title: `${draggingLineTypeRef.current!.toUpperCase()} (${newPrice.toFixed(
                2
              )})`,
            });
            return updated;
          });
        }
      } else {
        setCursor(nearest ? "grab" : "default");
        draggingLineTypeRef.current = nearest;
      }
    };

    const handleMouseDown = () => {
      if (draggingLineTypeRef.current) {
        isDraggingRef.current = true;
        setCursor("grabbing");
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setCursor("default");
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseup", handleMouseUp);

    // Setup ResizeObserver for responsive chart
    resizeObserverRef.current = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid layout thrashing
      requestAnimationFrame(() => {
        resizeChart();
      });
    });
    resizeObserverRef.current.observe(container);

    // Initial resize
    setTimeout(() => {
      resizeChart();
    }, 100);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      chart.remove();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        resizeChart();
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !initialDataRef.current) return;
    if (orderType === "limit") {
      const lastPrice =
        initialDataRef.current[initialDataRef.current.length - 1].close;
      const updatedLines = {
        limit: lastPrice,
        sl: lastPrice - slPoints,
        tp: lastPrice + tpPoints,
      };
      setPriceLines(updatedLines);
      createPriceLines(updatedLines);
    } else {
      removePriceLines();
    }
  }, [orderType]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={chartContainerRef}
        className="w-full h-full"
        style={{ cursor: cursor }}
      />
      <div className="absolute top-2 left-2 bg-gray-800 p-2 rounded-lg shadow-lg z-20 text-white text-xs">
        <div className="mb-2">
          <label className="block mb-1">Qty:</label>
          <input
            className="border rounded px-1 py-0.5 w-16 text-black"
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
              onChange={() => {
                setOrderType("limit");
                setShowPlaceOrder(true);
              }}
              className="mr-1"
            />
            Limit
          </label>
          <label className="block">
            <input
              type="radio"
              checked={orderType === "market"}
              onChange={() => {
                setOrderType("market");
                setShowPlaceOrder(false);
              }}
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
                className="w-12 px-1 py-0.5 text-black rounded"
              />
            </div>
            <div className="mb-1">
              <label className="block text-xs">TP (pts):</label>
              <input
                type="number"
                value={tpPoints}
                onChange={(e) => setTpPoints(Number(e.target.value))}
                className="w-12 px-1 py-0.5 text-black rounded"
              />
            </div>
            <button
              onClick={() => setShowPlaceOrder(true)}
              className="mt-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
            >
              Set SL/TP
            </button>
          </div>
        )}

        {showPlaceOrder && (
          <button className="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-medium">
            Place Order
          </button>
        )}
      </div>
    </div>
  );
};

export default TradingViewChart;