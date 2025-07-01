/** eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from "lightweight-charts";
import useStore from "../../store/store";

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

  const keys = ["limit", "sl", "tp"] as const;
  type LineType = (typeof keys)[number];

  const generateMockData = () => {
    const data: CandlestickData[] = [];
    let basePrice = 5500;
    const now = new Date();
    for (let i = 100; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 10);
      const open = basePrice + Math.random() * 10;
      const high = open + Math.random() * 10;
      const low = Math.max(0, open - Math.random() * 10);
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

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    const chart = createChart(container, {
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

    const data = generateMockData();
    initialDataRef.current = data;
    candleSeries.setData(data);
    chart.timeScale().fitContent();

    seriesRef.current = candleSeries;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trade || !seriesRef.current) return;
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

      if (!trade?.entryType) canDrag = true;
      else if (trade.entryType === "LIMIT" && trade.entryTriggered === false)
        canDrag = true;
      else if (
        ["LIMIT", "MARKET"].includes(trade.entryType) &&
        trade.entryTriggered
      ) {
        canDrag = lineType === "sl" || lineType === "tp";
      }

      if (canDrag) {
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

    resizeObserverRef.current = new ResizeObserver(() =>
      requestAnimationFrame(resizeChart)
    );
    resizeObserverRef.current.observe(container);

    setTimeout(resizeChart, 100);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
      resizeObserverRef.current?.disconnect();
      chart.remove();
    };
  }, [trade]);

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
          : lastPrice - 5,
      tp:
        trade.takeProfitPremium && trade.takeProfitPremium !== 0
          ? trade.takeProfitPremium
          : lastPrice + 5,
    };

    createPriceLines(updatedLines);
  }, [trade]);

  if (!trade) return <div>Trade not found</div>;

  return (
    <div ref={chartContainerRef} className="w-full h-full" style={{ cursor }} />
  );
};

export default TradingViewChart;
