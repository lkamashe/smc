import React from "react";

const ChartView = ({ chartData, currentTrade }) => {
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
      
      <div data-testid="chart-container" className="rounded-lg overflow-hidden bg-[#0f0f10] border border-gray-800" style={{ height: "500px" }}>
        {chartData && chartData.m15_candles && chartData.m15_candles.length > 0 ? (
          <div className="flex items-center justify-center h-full flex-col space-y-4">
            <svg className="w-20 h-20 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="text-center space-y-2">
              <p className="text-green-400 font-semibold text-lg">Chart Data Available</p>
              <p className="text-gray-400">{chartData.m15_candles.length} candles loaded</p>
              {currentTrade && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 rounded border border-amber-500/30">
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-amber-400 font-bold">${currentTrade.entry_price}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 rounded border border-red-500/30">
                    <span className="text-gray-400">Stop Loss:</span>
                    <span className="text-red-400 font-bold">${currentTrade.stop_loss}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 bg-green-500/10 rounded border border-green-500/30">
                    <span className="text-gray-400">Take Profit:</span>
                    <span className="text-green-400 font-bold">${currentTrade.take_profit}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
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
    </div>
  );
};

export default ChartView;