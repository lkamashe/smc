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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, setUser }) => {
  const [scanning, setScanning] = useState(false);
  const [h4Bias, setH4Bias] = useState("Neutral");
  const [currentTrade, setCurrentTrade] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [activeTab, setActiveTab] = useState("signal");

  useEffect(() => {
    loadCurrentTrade();
  }, []);

  const loadCurrentTrade = async () => {
    try {
      const response = await axios.get(`${API}/trades/current`);
      if (response.data) {
        setCurrentTrade(response.data);
        setH4Bias(response.data.bias);
        setChartData(response.data.chart_snapshot);
      }
    } catch (error) {
      console.error("Error loading trade:", error);
    }
  };

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

  const handleUpdateStatus = async (tradeId, status) => {
    try {
      await axios.put(`${API}/trades/${tradeId}/status`, { status });
      toast.success(`Trade status updated to ${status}`);
      await loadCurrentTrade();
    } catch (error) {
      toast.error("Failed to update trade status");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
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
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>XAU SMC Auto Trader</h1>
            </div>
            
            <Badge data-testid="h4-bias-badge" className={`px-4 py-1.5 text-sm font-semibold border ${getBiasColor(h4Bias)}`}>
              H4: {h4Bias}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              data-testid="scan-now-button"
              onClick={handleScan}
              disabled={scanning}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-6 py-2 rounded-lg shadow-lg shadow-amber-500/30 transition-all duration-300 hover:shadow-amber-500/50 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scanning...
                </>
              ) : "Scan Now"}
            </Button>
            
            <div className="flex items-center space-x-3">
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-amber-500/50" />
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
              <Button
                data-testid="logout-button"
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart View - 2 columns */}
          <div className="lg:col-span-2">
            <ChartView chartData={chartData} currentTrade={currentTrade} />
          </div>

          {/* Signal Panel - 1 column */}
          <div>
            <SignalPanel currentTrade={currentTrade} onUpdateStatus={handleUpdateStatus} />
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
    </div>
  );
};

export default Dashboard;