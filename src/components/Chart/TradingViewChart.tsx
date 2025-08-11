import React, { useEffect, useRef, useState } from "react";
import { type CandleType, type Chart, type KLineData } from "klinecharts";
import { init, dispose } from "klinecharts";
// import { X, TrendingUp, TrendingDown } from "lucide-react";
import useStore from "../../store/store";
// import { toast } from "sonner";
// import { API_URL } from "../../config/config";
// import axios from "axios";
// import cookies from "js-cookie";

interface TradingViewChartProps {
  indexName: string;
  expiry: string;
  range: number;
  timeframe: string;
  chartType: "candle_solid" | "area";
  instanceId: string;
  chartData: KLineData[];
  isLoading: boolean;
  onRefreshData: () => void;
}

// interface OrderValues {
//   limitPrice: number;
//   takeProfit: number;
//   stopLoss: number;
//   currentPrice: number;
// }

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  instanceId,
  chartType = "candle_solid",
  indexName,
  expiry,
  range,
  isLoading,
  chartData,
  onRefreshData,
}) => {
  const chartRef = useRef<Chart | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const [ohlcData, setOhlcData] = useState<KLineData[]>([]);
  const { instances } = useStore();

  const instance = instances.find((i) => i.id === instanceId);
  console.log(instance, onRefreshData);

  console.log(chartType);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = init(chartContainerRef.current);

    chartRef.current = chart;

    chart?.setStyles({
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
        type: "candle_solid",
        area: {
          lineSize: 2,
          lineColor: "#4299e1",
          smooth: true,
          value: "close",
          backgroundColor: [
            {
              offset: 0,
              color: "rgba(66, 153, 225, 0.1)",
            },
            {
              offset: 1,
              color: "rgba(66, 153, 225, 0.05)",
            },
          ],
        },
      },
      indicator: {
        ohlc: {
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

    const ticker = `${indexName}-${expiry}-${range}`;
    // @ts-expect-error version issue
    chart?.setSymbol({ ticker });
    chart?.setPeriod({ span: 1, type: "minute" });

    chartRef.current?.setDataLoader({
      getBars: ({ callback }) => {
        callback(ohlcData);
      },
    });

    return () => {
      if (chartContainerRef.current) dispose(chartContainerRef.current);
    };
  }, [chartData]);

  useEffect(() => {
    // setInterval(() => {
    //   setOhlcData((prev) => ({..prev,prev[prev.length-1].high:100,low:10,close}))
    // },200)
    setOhlcData(chartData);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (!indexName || indexName === "select") {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <span>Select an instance to view chart</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gray-900">
      <div
        ref={chartContainerRef}
        className="w-full h-full border border-gray-400"
      />
    </div>
  );
};

export default TradingViewChart;
