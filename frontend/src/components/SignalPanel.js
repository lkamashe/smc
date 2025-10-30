import React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const SignalPanel = ({ currentTrade, onUpdateStatus }) => {
  if (!currentTrade) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Current Signal
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-400">No active signal</p>
          <p className="text-sm text-gray-500">Run a market scan to generate a signal</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      Active: "bg-green-500/20 text-green-400 border-green-500/50",
      TP: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      SL: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  const getDirectionColor = (bias) => {
    return bias === "Bullish" ? "text-green-400" : "text-red-400";
  };

  return (
    <div data-testid="signal-panel" className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Current Signal
        </h2>
        <Badge data-testid="signal-status-badge" className={`px-3 py-1 text-sm font-semibold border ${getStatusBadge(currentTrade.status)}`}>
          {currentTrade.status}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Asset & Bias */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Asset</div>
            <div className="text-lg font-bold text-white">{currentTrade.asset}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Bias (H4)</div>
            <div className={`text-lg font-bold ${getDirectionColor(currentTrade.bias)}`}>
              {currentTrade.bias}
            </div>
          </div>
        </div>

        {/* Setup */}
        <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Setup</div>
          <div className="text-sm text-white">{currentTrade.setup}</div>
        </div>

        {/* Entry, SL, TP */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-gray-800">
            <span className="text-sm text-gray-400">Entry (M15)</span>
            <span data-testid="entry-price" className="text-lg font-bold text-amber-400">${currentTrade.entry_price}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-800">
            <span className="text-sm text-gray-400">Stop Loss</span>
            <span data-testid="stop-loss-price" className="text-lg font-bold text-red-400">${currentTrade.stop_loss}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-800">
            <span className="text-sm text-gray-400">Take Profit</span>
            <span data-testid="take-profit-price" className="text-lg font-bold text-green-400">${currentTrade.take_profit}</span>
          </div>
        </div>

        {/* RR & Confidence */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Risk/Reward</div>
            <div className="text-xl font-bold text-white">{currentTrade.risk_reward}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">Confidence</div>
            <div className="text-xl font-bold text-purple-400">{currentTrade.confidence}%</div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-400">{currentTrade.note}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {currentTrade.status !== "TP" && currentTrade.status !== "SL" && (
          <div className="space-y-2 pt-4">
            {currentTrade.status === "Pending" && (
              <Button
                data-testid="activate-trade-button"
                onClick={() => onUpdateStatus(currentTrade.id, "Active")}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                Activate Trade
              </Button>
            )}
            
            {currentTrade.status === "Active" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  data-testid="hit-tp-button"
                  onClick={() => onUpdateStatus(currentTrade.id, "TP")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Hit TP
                </Button>
                <Button
                  data-testid="hit-sl-button"
                  onClick={() => onUpdateStatus(currentTrade.id, "SL")}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Hit SL
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 text-center pt-2">
          Generated: {new Date(currentTrade.timestamp).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </div>
      </div>
    </div>
  );
};

export default SignalPanel;