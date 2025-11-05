import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import ChartView from "../components/ChartView";
import SignalPanel from "../components/SignalPanel";
import History from "../components/History";
import StatsView from "../components/StatsView";
import LivePrice from "../components/LivePrice";
import Footer from "../components/Footer";
import PairsSelector from "../components/PairsSelector";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [scanning, setScanning] = useState(false);
  const [selectedPair, setSelectedPair] = useState("XAU/USD");
  const [h4Bias, setH4Bias] = useState("Neutral");
  const [currentTrade, setCurrentTrade] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [activeTab, setActiveTab] = useState("signal");

  const loadCurrentTrade = async () => {
    try {
      const response = await axios.get(`${API}/trades/current`, {
        params: { symbol: selectedPair }
      });
      if (response.data) {
        setCurrentTrade(response.data);
        setH4Bias(response.data.bias);
        setChartData(response.data.chart_snapshot);
      } else {
        // No current trade
        setCurrentTrade(null);
        setChartData(null);
      }
    } catch (error) {
      console.error("Error loading trade:", error);
    }
  };

  useEffect(() => {
    // Load current trade immediately when pair changes
    loadCurrentTrade();
    
    // Auto-scan on mount if no trade exists
    const checkAndScan = async () => {
      try {
        const response = await axios.get(`${API}/trades/current`, {
          params: { symbol: selectedPair }
        });
        if (!response.data) {
          // No trade exists, auto-scan
          handleScan();
        }
      } catch (error) {
        console.error("Error checking trade:", error);
      }
    };
    
    checkAndScan();
    
    // Auto-refresh every 10 seconds to check trade status
    const interval = setInterval(() => {
      loadCurrentTrade();
    }, 10000);
    
    // Auto-scan every 30 minutes to check for new opportunities
    const scanInterval = setInterval(() => {
      handleScan();
    }, 30 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(scanInterval);
    };
  }, [selectedPair]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const response = await axios.get(`${API}/analysis/scan`);
      
      setH4Bias(response.data.h4_bias);
      
      if (response.data.trade_signal) {
        toast.success("📊 New Signal Generated!");
        await loadCurrentTrade();
      } else {
        toast.info(response.data.message);
        if (response.data.h4_analysis) {
          setChartData({
            h4_candles: response.data.h4_analysis?.swing_highs || [],
            m15_candles: [],
            h4_analysis: response.data.h4_analysis,
            order_block: response.data.order_block
          });
        }
      }
    } catch (error) {
      toast.error("Scan failed: " + (error.response?.data?.detail || error.message));
    } finally {
      setScanning(false);
    }
  };

  const getBiasColor = (bias) => {
    switch(bias) {
      case "Bullish": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "Bearish": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#1a1520] to-[#0f1419]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-gray-800/50 backdrop-blur-xl bg-black/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>XAU SMC Auto Trader</h1>
                <p className="text-xs text-gray-500">Live Market Analysis • Daily Signal</p>
              </div>
            </div>
            
            <Badge data-testid="h4-bias-badge" className={`px-4 py-1.5 text-sm font-semibold border ${getBiasColor(h4Bias)}`}>
              H4: {h4Bias}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-400">System Active</span>
            </div>
            
            <Button
              data-testid="manual-scan-button"
              onClick={handleScan}
              disabled={scanning}
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm"
            >
              {scanning ? "Scanning..." : "Force Scan"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Live Price */}
        <div className="mb-6">
          <LivePrice />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart View - Full width on desktop */}
          <div className="lg:col-span-2">
            <ChartView chartData={chartData} currentTrade={currentTrade} />
          </div>

          {/* Signal Panel - Sticky on desktop */}
          <div className="lg:sticky lg:top-24 h-fit">
            <SignalPanel currentTrade={currentTrade} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList data-testid="tabs-list" className="bg-gray-900/50 border border-gray-800 p-1 rounded-lg">
              <TabsTrigger data-testid="history-tab" value="history" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                History
              </TabsTrigger>
              <TabsTrigger data-testid="stats-tab" value="stats" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-6">
              <History />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <StatsView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;