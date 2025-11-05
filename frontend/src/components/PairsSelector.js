import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "./ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PairsSelector = ({ selectedPair, onSelectPair }) => {
  const [pairs, setPairs] = useState({});
  const [activeTrades, setActiveTrades] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPairs();
    loadActiveTrades();
    
    const interval = setInterval(loadActiveTrades, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPairs = async () => {
    try {
      const response = await axios.get(`${API}/pairs`);
      setPairs(response.data.pairs);
    } catch (error) {
      console.error("Error loading pairs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTrades = async () => {
    try {
      const response = await axios.get(`${API}/trades/all-active`);
      const tradesMap = {};
      response.data.trades.forEach(trade => {
        tradesMap[trade.asset] = trade;
      });
      setActiveTrades(tradesMap);
    } catch (error) {
      console.error("Error loading active trades:", error);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading pairs...</div>;
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Trading Pairs
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(pairs).map(([symbol, info]) => {
          const isSelected = selectedPair === symbol;
          const hasActiveTrade = activeTrades[symbol];
          
          return (
            <Button
              key={symbol}
              onClick={() => onSelectPair(symbol)}
              className={`relative p-4 rounded-lg border transition-all duration-200 ${
                isSelected
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="text-left">
                <div className="font-bold text-sm">{symbol}</div>
                <div className="text-xs opacity-70">{info.category}</div>
              </div>
              
              {hasActiveTrade && (
                <div className="absolute top-1 right-1">
                  <div className={`w-2 h-2 rounded-full ${
                    hasActiveTrade.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
                  }`}></div>
                </div>
              )}
            </Button>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <span className="inline-flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Active Trade</span>
        </span>
        <span className="mx-2">•</span>
        <span className="inline-flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>Pending Trade</span>
        </span>
      </div>
    </div>
  );
};

export default PairsSelector;
