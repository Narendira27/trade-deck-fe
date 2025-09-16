import React, { useEffect, useRef } from "react";
import { type Chart, type KLineData, type CandleType } from "klinecharts";
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

  const { instances } = useStore();

  const instance = instances.find((i) => i.id === instanceId);
  console.log(instance, onRefreshData);

  useEffect(() => {
    const chart = init("chart");
    chartRef.current = chart;

    chart?.setStyles({
      grid: { show: false },
      xAxis: {
        show: true,
        axisLine: { show: true, color: "#4a5568", size: 1 },
        tickText: { show: true, color: "#a0aec0", size: 12, weight: "normal" },
        tickLine: { show: true, color: "#4a5568", size: 1, length: 3 },
      },
      yAxis: {
        show: true,
        axisLine: { show: true, color: "#4a5568", size: 1 },
        tickText: { show: true, color: "#a0aec0", size: 12, weight: "normal" },
        tickLine: { show: true, color: "#4a5568", size: 1, length: 3 },
      },
      crosshair: {
        show: true,
        horizontal: {
          show: true,
          line: { show: true, size: 1, color: "#718096" },
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
          line: { show: true, size: 1, color: "#718096" },
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
        type: chartType as CandleType,
        area: {
          lineSize: 2,
          lineColor: "#4299e1",
          smooth: true,
          value: "close",
          backgroundColor: [
            { offset: 0, color: "rgba(66, 153, 225, 0.1)" },
            { offset: 1, color: "rgba(66, 153, 225, 0.05)" },
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
    console.log(ticker);

    chart?.applyNewData([
      {
        close: 4976.16,
        high: 4977.99,
        low: 4970.12,
        open: 4972.89,
        timestamp: 1587660000000,
        volume: 204,
      },
      {
        close: 4977.33,
        high: 4979.94,
        low: 4971.34,
        open: 4973.2,
        timestamp: 1587660060000,
        volume: 194,
      },
      {
        close: 4977.93,
        high: 4977.93,
        low: 4974.2,
        open: 4976.53,
        timestamp: 1587660120000,
        volume: 197,
      },
      {
        close: 4966.77,
        high: 4968.53,
        low: 4962.2,
        open: 4963.88,
        timestamp: 1587660180000,
        volume: 28,
      },
      {
        close: 4961.56,
        high: 4972.61,
        low: 4961.28,
        open: 4961.28,
        timestamp: 1587660240000,
        volume: 184,
      },
      {
        close: 4964.19,
        high: 4964.74,
        low: 4961.42,
        open: 4961.64,
        timestamp: 1587660300000,
        volume: 191,
      },
      {
        close: 4968.93,
        high: 4972.7,
        low: 4964.55,
        open: 4966.96,
        timestamp: 1587660360000,
        volume: 105,
      },
      {
        close: 4979.31,
        high: 4979.61,
        low: 4973.99,
        open: 4977.06,
        timestamp: 1587660420000,
        volume: 35,
      },
      {
        close: 4977.02,
        high: 4981.66,
        low: 4975.14,
        open: 4981.66,
        timestamp: 1587660480000,
        volume: 135,
      },
      {
        close: 4985.09,
        high: 4988.62,
        low: 4980.3,
        open: 4986.72,
        timestamp: 1587660540000,
        volume: 76,
      },
    ]);

    return () => {
      dispose("chart");
    };
  }, []);

  useEffect(() => { 
    if (!chartRef.current) return;
    if (chartData.length === 0) return;

    chartRef.current.applyNewData(chartData);
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
      <div id="chart" className="w-full h-full border border-gray-400" />
    </div>
  );
};

export default TradingViewChart;
