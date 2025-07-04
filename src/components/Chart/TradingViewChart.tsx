/** eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from "lightweight-charts";
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
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ tradeId }) => {
  const { trades } = useStore();
  const trade = trades.find((t) => t.id === tradeId);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<
    Record<
      string,
      ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null
    >
  >({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [cursor, setCursor] = useState("default");
  const isDraggingRef = useRef(false);
  const draggingLineTypeRef = useRef<"limit" | "sl" | "tp" | null>(null);
  const initialDataRef = useRef<CandlestickData[] | null>(null);

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
    }, 500); // 500ms debounce delay
  };

  const updatePriceOnBackend = async (type: LineType, price: number) => {
    if (!trade) return;
    console.log(type, price);

    // try {
    //   const res = await fetch(`/api/update-price`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       tradeId: trade.id,
    //       priceType: type, // "limit", "sl", "tp"
    //       price: price,
    //     }),
    //   });

    //   if (res.ok) {
    //     toast.success(`${type.toUpperCase()} price updated`);
    //   } else {
    //     toast.error(`Failed to update ${type.toUpperCase()} price`);
    //   }
    // } catch (error) {
    //   console.error(error);
    //   toast.error("Error updating price");
    // }
  };

  const generateData = async () => {
    const token = cookies.get("auth");
    const data = await axios.get(API_URL + "/user/candle/", {
      headers: { Authorization: "Bearer " + token },
      params: {
        indexName: "NIFTY",
        expiryDate: "10JUL2025",
        range: "100",
      },
    });
    const candleData = data.data.data;
    return candleData;
  };

  const removePriceLines = () => {
    keys.forEach((key) => {
      if (priceLinesRef.current[key]) {
        seriesRef.current?.removePriceLine(priceLinesRef.current[key]!);
        priceLinesRef.current[key] = null;
      }
    });
  };

  const createPriceLines = (prices: {
    limit: number;
    sl: number;
    tp: number;
  }) => {
    if (!seriesRef.current) return;
    removePriceLines();

    if (trade?.entryType === "UNDEFINED" && orderType === "market") {
      return;
    }

    keys.forEach((key) => {
      priceLinesRef.current[key] = seriesRef.current!.createPriceLine({
        price: prices[key],
        color: key === "sl" ? "#ef5350" : key === "tp" ? "#26a69a" : "#2962FF",
        lineWidth: 2,
        axisLabelVisible: true,
        title: `${key.toUpperCase()} (${prices[key].toFixed(2)})`,
        lineStyle: 0,
      });
    });
  };

  // const resizeChart = () => {
  //   if (chartRef.current && chartContainerRef.current) {
  //     const rect = chartContainerRef.current.getBoundingClientRect();
  //     chartRef.current.applyOptions({
  //       width: rect.width,
  //       height: rect.height,
  //     });
  //     chartRef.current.timeScale().fitContent();
  //   }
  // };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let chart: IChartApi | null = null;

    // 🔥 1. Set up IntersectionObserver to detect visibility
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          // 🔥 2. Only initialize chart when container is visible
          chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: { background: { color: "#1f2937" }, textColor: "#d1d5db" },
            grid: {
              vertLines: { visible: false, color: "#374151" },
              horzLines: { visible: true, color: "#374151" },
            },
            timeScale: { timeVisible: true },
            crosshair: { mode: 1 },
            handleScale: {
              axisPressedMouseMove: { time: false, price: false },
              mouseWheel: true,
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

          const data = await generateData();
          initialDataRef.current = data;
          candleSeries.setData(data);
          chart.timeScale().fitContent();

          seriesRef.current = candleSeries;
          setChartReady(true);

          const resizeChart = () => {
            if (chartRef.current && chartContainerRef.current) {
              const rect = chartContainerRef.current.getBoundingClientRect();
              chartRef.current.applyOptions({
                width: rect.width,
                height: rect.height,
              });
              chartRef.current.timeScale().fitContent();
            }
          };

          resizeObserverRef.current = new ResizeObserver(() =>
            requestAnimationFrame(resizeChart)
          );
          resizeObserverRef.current.observe(container);

          setTimeout(resizeChart, 100);

          // 🔥 3. Disconnect observer after initialization (optional)
          observer.unobserve(container);
        }
      },
      { threshold: 0.5 } // 🔥 Adjust threshold (0.5 = 50% visible)
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      resizeObserverRef.current?.disconnect();

      // Clean up chart instance safely
      if (chart) {
        try {
          chart.remove();
        } catch (error) {
          console.warn("Chart disposal error:", error);
        }
        chart = null;
      }

      // Clear refs
      chartRef.current = null;
      seriesRef.current = null;
      setChartReady(false);
    };
  }, [chartContainerRef.current]); // Empty dependency array to run only once

  useEffect(() => {
    if (!chartReady) return;
    const container = chartContainerRef.current;
    if (!container || !seriesRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;

      let nearest: LineType | null = null;
      let minDistance = Infinity;

      keys.forEach((key) => {
        const line = priceLinesRef.current[key];
        if (!line) return;
        const coord = seriesRef.current!.priceToCoordinate(
          line.options().price
        );
        if (coord === undefined || coord === null) return;
        const dist = Math.abs(y - coord);
        if (dist < 10 && dist < minDistance) {
          nearest = key;
          minDistance = dist;
        }
      });

      if (isDraggingRef.current && draggingLineTypeRef.current) {
        //  @ts-ignore
        const newPrice = seriesRef.current.coordinateToPrice(y);
        if (newPrice !== null && newPrice !== undefined) {
          priceLinesRef.current[draggingLineTypeRef.current]?.applyOptions({
            price: newPrice,
            title: `${draggingLineTypeRef.current.toUpperCase()} (${newPrice.toFixed(
              2
            )})`,
          });
        }
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
          const updatedPrice = priceLinesRef.current[lineType]?.options().price;

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
  }, [trade, orderType, chartReady]);

  useEffect(() => {
    if (!seriesRef.current || !initialDataRef.current || !trade) return;

    const lastPrice =
      initialDataRef.current[initialDataRef.current.length - 1].close;

    const updatedLines = {
      limit:
        trade.entryPrice && trade.entryPrice !== 0
          ? trade.entryPrice
          : lastPrice,
      sl:
        trade.stopLossPremium && trade.stopLossPremium !== 0
          ? trade.stopLossPremium
          : lastPrice,
      tp:
        trade.takeProfitPremium && trade.takeProfitPremium !== 0
          ? trade.takeProfitPremium
          : lastPrice,
    };

    createPriceLines(updatedLines);
  }, [trade, orderType]);

  const placeOrder = () => {
    const limitPrice = priceLinesRef.current.limit?.options().price;
    const slPrice = priceLinesRef.current.sl?.options().price;
    const tpPrice = priceLinesRef.current.tp?.options().price;

    if (!limitPrice && orderType === "market") {
      toast.warning("Entry price is required");
      return;
    }

    if (!qty) {
      toast.warning("Qty is required");
      return;
    }

    if (!tpPrice) {
      toast.warning("TP is required");
      return;
    }

    if (!slPrice) {
      toast.warning("SL is required");
      return;
    }

    console.log(limitPrice, slPrice, tpPrice);
  };

  if (!trade) return <div>Trade not found</div>;

  return (
    <div ref={chartContainerRef} className="w-full h-full" style={{ cursor }}>
      {trade.entryType === "UNDEFINED" ? (
        <div className="absolute  top-10 left-2 bg-gray-700 border  border-b-gray-700/2    p-2 rounded-xl  z-20 text-white text-xs">
          <div className="mb-2">
            <label className="block mb-1">Qty:</label>
            <input
              className="border rounded px-1 py-0.5 w-16 text-white"
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
                  className="w-12 px-1 py-0.5 border border-white text-white rounded"
                />
              </div>
              <div className="mb-1">
                <label className="block text-xs">TP (pts):</label>
                <input
                  type="number"
                  value={tpPoints}
                  onChange={(e) => setTpPoints(Number(e.target.value))}
                  className="w-12 px-1 py-0.5 border border-white text-white rounded"
                />
              </div>
            </div>
          )}

          <button
            onClick={placeOrder}
            className="mt-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 font-medium"
          >
            Place Order
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default TradingViewChart;
