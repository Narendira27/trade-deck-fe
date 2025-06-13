import React, { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
} from "lightweight-charts";

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  chartType: "line" | "candlestick";
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  timeframe,
  chartType,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<
    ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null
  >(null);

  // Generate mock data
  const generateMockData = () => {
    const data: CandlestickData[] = [];
    let basePrice = 24000;
    const now = new Date();

    for (let i = 100; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
      const open = basePrice + (Math.random() - 0.5) * 100;
      const volatility = 50;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);

      data.push({
        time: Math.floor(time.getTime() / 1000) as any,
        open,
        high,
        low,
        close,
      });

      basePrice = close;
    }

    return data;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: "#1f2937" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#4b5563",
      },
      timeScale: {
        borderColor: "#4b5563",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create series based on chart type
    let series: ISeriesApi<"Candlestick"> | ISeriesApi<"Line">;

    if (chartType === "candlestick") {
      series = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        borderUpColor: "#10b981",
        wickDownColor: "#ef4444",
        wickUpColor: "#10b981",
      });

      const candleData = generateMockData();
      series.setData(candleData);
    } else {
      series = chart.addLineSeries({
        color: "#3b82f6",
        lineWidth: 2,
      });

      const candleData = generateMockData();
      const lineData: LineData[] = candleData.map((candle) => ({
        time: candle.time,
        value: candle.close,
      }));
      series.setData(lineData);
    }

    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [chartType, symbol, timeframe]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-full bg-gray-800 rounded-lg"
      style={{ minHeight: "300px" }}
    />
  );
};

export default TradingViewChart;
