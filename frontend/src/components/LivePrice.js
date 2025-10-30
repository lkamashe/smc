import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LivePrice = () => {
  const [price, setPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get(`${API}/trades/current`);
        if (response.data && response.data.current_market_price) {
          const newPrice = response.data.current_market_price;
          setPrevPrice(price);
          setPrice(newPrice);
        }
      } catch (error) {
        console.error("Error fetching price:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000);

    return () => clearInterval(interval);
  }, [price]);

  const getPriceColor = () => {
    if (!prevPrice || !price) return "text-amber-400";
    if (price > prevPrice) return "text-green-400";
    if (price < prevPrice) return "text-red-400";
    return "text-amber-400";
  };

  const getPriceIcon = () => {
    if (!prevPrice || !price) return null;
    if (price > prevPrice) return "↑";
    if (price < prevPrice) return "↓";
    return "";
  };

  if (loading || !price) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-4">
        <div className="text-gray-500 text-sm">Loading price...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-2 border-amber-500/50 rounded-xl p-6 backdrop-blur-xl shadow-lg shadow-amber-500/20">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-amber-400 font-semibold mb-1 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>LIVE PRICE</span>
          </div>
          <div className="text-sm text-gray-400">XAUUSD</div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getPriceColor()} transition-colors duration-300`}>
            ${price?.toFixed(2)}
            <span className="text-2xl ml-2">{getPriceIcon()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePrice;