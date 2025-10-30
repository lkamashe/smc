import React, { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "./ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const History = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API}/trades/history`);
      setTrades(response.data);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      Active: "bg-green-500/20 text-green-400 border-green-500/50",
      TP: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      SL: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  const getResultBadge = (result) => {
    if (result === "Win") return "bg-green-500/20 text-green-400 border-green-500/50";
    if (result === "Loss") return "bg-red-500/20 text-red-400 border-red-500/50";
    return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading history...</div>
        </div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400">No trade history yet</p>
          <p className="text-sm text-gray-500">Your completed trades will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="history-list" className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Trade History
      </h2>
      
      <div className="space-y-4">
        {trades.map((trade) => (
          <div
            key={trade.id}
            data-testid={`trade-item-${trade.id}`}
            className="bg-black/30 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`text-2xl font-bold ${trade.bias === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                  {trade.bias === "Bullish" ? "↑" : "↓"}
                </div>
                <div>
                  <div className="font-semibold text-white">{trade.asset}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(trade.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={`px-2 py-1 text-xs border ${getStatusBadge(trade.status)}`}>
                  {trade.status}
                </Badge>
                {trade.result && (
                  <Badge className={`px-2 py-1 text-xs border ${getResultBadge(trade.result)}`}>
                    {trade.result}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs">Entry</div>
                <div className="text-white font-semibold">${trade.entry_price}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">SL</div>
                <div className="text-red-400 font-semibold">${trade.stop_loss}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">TP</div>
                <div className="text-green-400 font-semibold">${trade.take_profit}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">RR</div>
                <div className="text-purple-400 font-semibold">{trade.risk_reward}</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
              {trade.setup} • Confidence: {trade.confidence}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;