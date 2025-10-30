import React, { useRef, useEffect } from "react";
import * as LightweightCharts from "lightweight-charts";

const ChartView = ({ chartData, currentTrade }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: "#0f0f10" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#1a1a1b" },
        horzLines: { color: "#1a1a1b" },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "#2B2B43",
      },
      timeScale: {
        borderColor: "#2B2B43",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Add data if available
    if (chartData?.m15_candles && chartData.m15_candles.length > 0) {
      candlestickSeries.setData(chartData.m15_candles);

      // Add markers for entry, SL, TP
      if (currentTrade) {
        const lastCandle = chartData.m15_candles[chartData.m15_candles.length - 1];
        
        // Entry line
        const entryLine = candlestickSeries.createPriceLine({
          price: currentTrade.entry_price,
          color: "#fbbf24",
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "Entry",
        });

        // Stop Loss line
        const slLine = candlestickSeries.createPriceLine({
          price: currentTrade.stop_loss,
          color: "#ef4444",
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "SL",
        });

        // Take Profit line
        const tpLine = candlestickSeries.createPriceLine({
          price: currentTrade.take_profit,
          color: "#22c55e",
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "TP",
        });
      }

      chart.timeScale().fitContent();
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData, currentTrade]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          XAUUSD M15 Chart
        </h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Bullish OB</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Bearish OB</span>
          </div>
        </div>
      </div>
      
      <div data-testid="chart-container" ref={chartContainerRef} className="rounded-lg overflow-hidden" />
      
      {!chartData && (
        <div className="flex items-center justify-center h-[500px] text-gray-500">
          <div className="text-center space-y-2">
            <svg className="w-16 h-16 mx-auto text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg">No chart data available</p>
            <p className="text-sm">Click "Scan Now" to analyze the market</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartView;