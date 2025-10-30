import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatsView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_trades === 0) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-400">No statistics available yet</p>
          <p className="text-sm text-gray-500">Complete some trades to see your performance</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="stats-container" className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Performance Statistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Trades */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-blue-400 font-medium">Total Trades</div>
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div data-testid="total-trades" className="text-4xl font-bold text-white">{stats.total_trades}</div>
        </div>

        {/* Win Rate */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-green-400 font-medium">Win Rate</div>
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="flex items-baseline space-x-2">
            <div data-testid="win-rate" className="text-4xl font-bold text-white">{stats.win_rate}%</div>
            <div className="text-sm text-gray-400">({stats.wins}W / {stats.losses}L)</div>
          </div>
        </div>

        {/* Average RR */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-purple-400 font-medium">Avg Risk/Reward</div>
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div data-testid="avg-rr" className="text-4xl font-bold text-white">1:{stats.avg_rr}</div>
        </div>
      </div>

      {/* Streak */}
      <div className="mt-6 bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-amber-400 font-medium mb-1">Current Win Streak</div>
            <div data-testid="win-streak" className="text-3xl font-bold text-white">{stats.current_streak}</div>
          </div>
          <div className="text-5xl">
            {stats.current_streak > 0 ? "🔥" : "💪"}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Wins</div>
          <div data-testid="total-wins" className="text-2xl font-bold text-green-400">{stats.wins}</div>
        </div>
        <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 mb-1">Losses</div>
          <div data-testid="total-losses" className="text-2xl font-bold text-red-400">{stats.losses}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsView;