import React from "react";
import { Button } from "./ui/button";

const HeroSection = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#1a1520] to-[#0f1419] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-600 rounded-full filter blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-6 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-amber-400 text-sm font-semibold">LIVE MARKET ANALYSIS</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                XAU SMC
              </span>
              <br />
              <span className="text-white">Auto Trader</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Professional Smart Money Concepts analysis for Gold (XAUUSD).
              <br />
              <span className="text-amber-400 font-semibold">One Signal. One Opportunity. Every Day.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-green-400 font-bold text-lg mb-2">Real-Time Data</div>
              <div className="text-gray-400 text-sm">Live market analysis with TradingView integration</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-purple-400 font-bold text-lg mb-2">SMC Methodology</div>
              <div className="text-gray-400 text-sm">Order Blocks, Liquidity Sweeps, BOS/CHoCH</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-amber-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl mb-3">🤖</div>
              <div className="text-amber-400 font-bold text-lg mb-2">Fully Automated</div>
              <div className="text-gray-400 text-sm">24/7 monitoring with auto trade updates</div>
            </div>
          </div>

          <div className="pt-8">
            <Button
              onClick={onEnter}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black text-lg font-bold px-12 py-6 rounded-xl shadow-2xl shadow-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/70"
            >
              Enter Trading Dashboard
              <svg className="w-6 h-6 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>

          <div className="pt-8 flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Real Market Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free to Use</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Login Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;