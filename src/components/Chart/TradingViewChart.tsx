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

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 500,
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

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
      resizeObserver.disconnect();
      chart.remove();
    };
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
    <div style={{ width: "100%", height: "500px", position: "relative" }}>
      <div
        ref={chartContainerRef}
        style={{ width: "100%", height: "100%", cursor: cursor }}
      />
      <div
        className="text-white"
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          backgroundColor: "#374151",

          padding: 10,
          borderRadius: 8,
          boxShadow: "0 0 8px rgba(0,0,0,0.2)",
          zIndex: 20,
        }}
      >
        <div>
          <label>Qty:</label>
          <input
            className="border rounded-md px-1"
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            style={{ width: 60, marginLeft: 5 }}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>
            <input
              type="radio"
              checked={orderType === "limit"}
              onChange={() => {
                setOrderType("limit");
                setShowPlaceOrder(true);
              }}
            />
            Limit
          </label>
          <label style={{ marginLeft: 10 }}>
            <input
              type="radio"
              checked={orderType === "market"}
              onChange={() => {
                setOrderType("market");
                setShowPlaceOrder(false);
              }}
            />
            Market
          </label>
        </div>

        {orderType === "market" && (
          <div style={{ marginTop: 10 }}>
            <div>
              SL (pts):
              <input
                type="number"
                value={slPoints}
                onChange={(e) => setSlPoints(Number(e.target.value))}
                style={{ width: 50, marginLeft: 5 }}
              />
            </div>
            <div>
              TP (pts):
              <input
                type="number"
                value={tpPoints}
                onChange={(e) => setTpPoints(Number(e.target.value))}
                style={{ width: 50, marginLeft: 5 }}
              />
            </div>
            <button
              onClick={() => setShowPlaceOrder(true)}
              style={{
                marginTop: 10,
                backgroundColor: "#26a69a",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
              }}
            >
              Set SL/TP
            </button>
          </div>
        )}

        {showPlaceOrder && (
          <button
            style={{
              marginTop: 4,
              backgroundColor: "#2962FF",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Place Order
          </button>
        )}
      </div>
    </div>
  );
};

export default TradingViewChart;
