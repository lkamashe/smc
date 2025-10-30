import React from "react";
import { Badge } from "./ui/badge";

const SignalPanel = ({ currentTrade }) => {
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
      Active: "bg-green-500/20 text-green-400 border-green-500/50 animate-pulse",
      TP: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      SL: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  const getDirectionColor = (bias) => {
    return bias === "Bullish" ? "text-green-400" : "text-red-400";
  };

  const getStatusMessage = (status) => {
    const messages = {
      Pending: "⏳ Entry signal detected - Waiting for optimal entry...",
      Active: "🔥 Trade is LIVE - Monitoring price action...",
      TP: "✅ TARGET HIT! Trade closed in profit",
      SL: "❌ Stop Loss Hit - Trade closed"
    };
    return messages[status] || "";
  };
  
  const getTimeElapsed = (timestamp) => {
    const now = new Date();
    const tradeTime = new Date(timestamp);
    const diff = Math.floor((now - tradeTime) / 1000 / 60);
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m ago`;
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

      {/* Status Message */}
      <div className={`text-center py-3 rounded-lg ${
        currentTrade.status === 'TP' ? 'bg-emerald-500/10 border border-emerald-500/30' :
        currentTrade.status === 'SL' ? 'bg-red-500/10 border border-red-500/30' :
        currentTrade.status === 'Active' ? 'bg-green-500/10 border border-green-500/30' :
        'bg-blue-500/10 border border-blue-500/30'
      }`}>
        <p className="text-sm font-semibold">{getStatusMessage(currentTrade.status)}</p>
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

        {/* Auto-update notice */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-400">🤖 Trade status updates automatically</p>
        </div>

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