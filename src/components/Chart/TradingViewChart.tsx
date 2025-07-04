/** eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
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

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  tradeId,
  chartType = "candlestick",
}) => {
  const { trades, optionValues } = useStore();
  const trade = trades.find((t) => t.id === tradeId);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // @ts-expect-error "error"

  const lineSeriesRef = useRef<LineSeriesApi | null>(null);
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
  const initialDataRef = useRef<CandlestickData[] | LineData[] | null>(null);

  const [chartReady, setChartReady] = useState(false);

  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [slPoints, setSlPoints] = useState(5);
  const [tpPoints, setTpPoints] = useState(5);

  // @ts-expect-error "error"
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keys = ["limit", "sl", "tp"] as const;
  type LineType = (typeof keys)[number];

  const debouncedUpdatePrice = (type: LineType, price: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      updatePriceOnBackend(type, price);
    }, 500);
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

  const generateData = async () => {
    if (!trade) return;
    const token = cookies.get("auth");
    const data = await axios.get(API_URL + "/user/candle/", {
      headers: { Authorization: "Bearer " + token },
      params: {
        indexName: trade.indexName,
        expiryDate: trade.expiry,
        range: trade.ltpRange,
      },
    });
    const candleData = data.data.data;

    if (chartType === "line") {
      return candleData.map((candle: any) => ({
        time: candle.time,
        value: candle.close,
      }));
    }
    return candleData;
  };

  const removePriceLines = () => {
    keys.forEach((key) => {
      if (priceLinesRef.current[key]) {
        const series = candleSeriesRef.current || lineSeriesRef.current;
        series?.removePriceLine(priceLinesRef.current[key]!);
        priceLinesRef.current[key] = null;
      }
    });
  };

  const createPriceLines = (prices: {
    limit: number;
    sl: number;
    tp: number;
  }) => {
    const series = candleSeriesRef.current || lineSeriesRef.current;
    if (!series) return;

    removePriceLines();

    if (trade?.entryType === "UNDEFINED" && orderType === "market") {
      return;
    }

    keys.forEach((key) => {
      priceLinesRef.current[key] = series.createPriceLine({
        price: prices[key],
        color: key === "sl" ? "#ef5350" : key === "tp" ? "#26a69a" : "#2962FF",
        lineWidth: 2,
        axisLabelVisible: true,
        title: `${key.toUpperCase()} (${prices[key].toFixed(2)})`,
        lineStyle: 0,
      });
    });
  };

  useEffect(() => {
    if (!chartReady) return;
    const getValue = optionValues.filter((t) => t.id === tradeId);
    if (getValue.length <= 0) return;

    const liveValue = getValue[0].lowestCombinedPremium;

    if (liveValue === undefined || liveValue === null) return;

    const series = candleSeriesRef.current || lineSeriesRef.current;
    if (!series) return;

    const currentTime = Math.floor(Date.now() / 1000);

    if (chartType === "candlestick") {
      (series as ISeriesApi<"Candlestick">).update({
        // @ts-expect-error "error"
        time: currentTime,
        open: liveValue,
        high: liveValue,
        low: liveValue,
        close: liveValue,
      });
    } else {
      // @ts-expect-error "error"
      (series as LineSeriesApi).update({
        time: currentTime,
        value: liveValue,
      });
    }
  }, [optionValues, chartReady, chartType]);

  useEffect(() => {
    // console.log("Symbol changed:", symbol);

    if (!chartRef.current) return;

    generateData().then((data) => {
      initialDataRef.current = data;

      if (chartType === "candlestick" && candleSeriesRef.current) {
        candleSeriesRef.current.setData(data as CandlestickData[]);
      } else if (lineSeriesRef.current) {
        lineSeriesRef.current.setData(data as LineData[]);
      }
      // @ts-expect-error "error"

      chartRef.current.timeScale().fitContent();
    });
  }, [symbol]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let chart: IChartApi | null = null;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
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

          const data = await generateData();
          initialDataRef.current = data;

          if (chartType === "candlestick") {
            const candleSeries = chart.addCandlestickSeries({
              upColor: "#10b981",
              downColor: "#ef4444",
              borderDownColor: "#ef4444",
              borderUpColor: "#10b981",
              wickDownColor: "#ef4444",
              wickUpColor: "#10b981",
            });
            candleSeries.setData(data as CandlestickData[]);
            candleSeriesRef.current = candleSeries;
          } else {
            const lineSeries = chart.addLineSeries({
              color: "#3b82f6",
              lineWidth: 2,
            });
            lineSeries.setData(data as LineData[]);
            lineSeriesRef.current = lineSeries;
          }

          chart.timeScale().fitContent();
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
          chart.remove();
        } catch (error) {
          console.warn("Chart disposal error:", error);
        }
        chart = null;
      }

      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      setChartReady(false);
    };
  }, [chartContainerRef.current, chartType]);

  useEffect(() => {
    if (!chartReady) return;
    const container = chartContainerRef.current;
    if (!container || (!candleSeriesRef.current && !lineSeriesRef.current))
      return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;

      let nearest: LineType | null = null;
      let minDistance = Infinity;

      const series = candleSeriesRef.current || lineSeriesRef.current;
      if (!series) return;

      keys.forEach((key) => {
        const line = priceLinesRef.current[key];
        if (!line) return;
        const coord = series.priceToCoordinate(line.options().price);
        if (coord === undefined || coord === null) return;
        const dist = Math.abs(y - coord);
        if (dist < 10 && dist < minDistance) {
          nearest = key;
          minDistance = dist;
        }
      });

      if (isDraggingRef.current && draggingLineTypeRef.current) {
        const newPrice = series.coordinateToPrice(y);
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
  }, [trade, orderType, chartReady, chartType]);

  useEffect(() => {
    if (!initialDataRef.current || !trade) return;

    const lastPrice =
      chartType === "candlestick"
        ? (initialDataRef.current as CandlestickData[])[
            initialDataRef.current.length - 1
          ].close
        : (initialDataRef.current as LineData[])[
            initialDataRef.current.length - 1
          ].value;

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
  }, [trade, orderType, chartType]);

  const placeOrder = async () => {
    if (!trade) return;

    if (!qty) {
      toast.warning("Qty is required");
      return;
    }

    const token = cookies.get("auth");

    let limitPrice = priceLinesRef.current.limit?.options().price;
    let slPrice = priceLinesRef.current.sl?.options().price;
    let tpPrice = priceLinesRef.current.tp?.options().price;

    if (!limitPrice || !slPrice || !tpPrice) return;

    limitPrice = parseFloat(limitPrice.toFixed(2));
    slPrice = parseFloat(slPrice.toFixed(2));
    tpPrice = parseFloat(tpPrice.toFixed(2));

    if (orderType === "market") {
      await axios.put(
        API_URL + "/user/tradeInfo",
        {
          entryType: "MARKET",
          stopLossPoints: slPoints,
          takeProfitPoints: tpPoints,
        },
        {
          headers: { Authorization: "Bearer " + token },
          params: { id: trade.id },
        }
      );
    }

    if (orderType === "limit") {
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

  if (!trade) return <div>Trade not found</div>;

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full relative"
      style={{ cursor }}
    >
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

export default TradingViewChart;
