import React from "react";

const ChartView = ({ chartData, currentTrade }) => {
  // Extract analysis data
  const h4Analysis = chartData?.h4_analysis;
  const orderBlock = chartData?.order_block;
  const m15Setup = chartData?.m15_setup;
  const candlesCount = chartData?.m15_candles?.length || 0;

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          XAUUSD Analysis
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
      
      <div data-testid="chart-container" className="rounded-lg overflow-hidden bg-[#0f0f10] border border-gray-800" style={{ minHeight: "500px" }}>
        {chartData && candlesCount > 0 ? (
          <div className="p-6 space-y-6">
            {/* Market Structure Analysis */}
            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                H4 Market Structure
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Bias</div>
                  <div className={`text-xl font-bold ${h4Analysis?.bias === 'Bullish' ? 'text-green-400' : h4Analysis?.bias === 'Bearish' ? 'text-red-400' : 'text-gray-400'}`}>
                    {h4Analysis?.bias || 'N/A'}
                  </div>
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Structure</div>
                  <div className="text-sm text-white">
                    {h4Analysis?.reason || 'No clear structure'}
                  </div>
                </div>
              </div>
              
              {/* Swing Points */}
              {h4Analysis && (h4Analysis.swing_highs?.length > 0 || h4Analysis.swing_lows?.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {h4Analysis.swing_highs?.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="text-xs text-red-400 mb-2">Swing Highs</div>
                      <div className="space-y-1">
                        {h4Analysis.swing_highs.slice(-2).map((sh, idx) => (
                          <div key={idx} className="text-sm text-red-300">
                            ${sh.price?.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {h4Analysis.swing_lows?.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="text-xs text-green-400 mb-2">Swing Lows</div>
                      <div className="space-y-1">
                        {h4Analysis.swing_lows.slice(-2).map((sl, idx) => (
                          <div key={idx} className="text-sm text-green-300">
                            ${sl.price?.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Block */}
            {orderBlock && (
              <div className={`bg-gradient-to-br ${orderBlock.type === 'demand' ? 'from-green-500/5 to-emerald-500/5 border-green-500/20' : 'from-red-500/5 to-rose-500/5 border-red-500/20'} border rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center ${orderBlock.type === 'demand' ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-4 h-4 rounded-full ${orderBlock.type === 'demand' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                  {orderBlock.type === 'demand' ? 'Demand' : 'Supply'} Zone (HTF Order Block)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">High</div>
                    <div className="text-lg font-bold text-white">${orderBlock.high?.toFixed(2)}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Low</div>
                    <div className="text-lg font-bold text-white">${orderBlock.low?.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* M15 Setup Details */}
            {m15Setup && (
              <div className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border border-amber-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  M15 Execution Setup
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Direction</div>
                    <div className={`text-lg font-bold ${m15Setup.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                      {m15Setup.direction}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Confidence</div>
                    <div className="text-lg font-bold text-purple-400">{m15Setup.confidence}%</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Setup Type</div>
                    <div className="text-xs text-white">Sweep + OB</div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart representation */}
            <div className="bg-gradient-to-br from-gray-500/5 to-slate-500/5 border border-gray-700 rounded-xl p-6">
              <div className="text-center space-y-3">
                <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-green-400 font-semibold text-lg">Market Data Analyzed</p>
                <p className="text-gray-400 text-sm">{candlesCount} M15 candles processed</p>
                {currentTrade && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <span className="text-gray-400 text-sm">Entry Price:</span>
                      <span className="text-amber-400 font-bold text-lg">${currentTrade.entry_price}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-red-500/10 rounded-lg border border-red-500/30">
                      <span className="text-gray-400 text-sm">Stop Loss:</span>
                      <span className="text-red-400 font-bold text-lg">${currentTrade.stop_loss}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-green-500/10 rounded-lg border border-green-500/30">
                      <span className="text-gray-400 text-sm">Take Profit:</span>
                      <span className="text-green-400 font-bold text-lg">${currentTrade.take_profit}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              💡 Full technical analysis based on SMC methodology
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[500px] text-gray-500">
            <div className="text-center space-y-2">
              <svg className="w-16 h-16 mx-auto text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg">No market analysis yet</p>
              <p className="text-sm">Click "Scan Now" to analyze XAUUSD</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartView;