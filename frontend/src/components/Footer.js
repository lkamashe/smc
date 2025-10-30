import React from "react";

const Footer = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-xl border-t border-gray-800 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>XAU SMC</span>
            </div>
            <p className="text-gray-400 text-sm">Professional Smart Money Concepts analysis for XAUUSD trading.</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-bold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• H4 Bias Analysis</li>
              <li>• M15 Execution</li>
              <li>• Order Block Detection</li>
              <li>• Live Market Data</li>
            </ul>
          </div>

          {/* Trading Hours */}
          <div>
            <h3 className="text-white font-bold mb-4">Market Hours</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>System: <span className="text-green-400">24/7 Active</span></li>
              <li>Analysis: Every 30min</li>
              <li>Updates: Every 1min</li>
              <li>Timezone: UTC</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-white font-bold mb-4">Disclaimer</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Trading involves risk. This tool provides analysis only and is not financial advice. Always do your own research.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-gray-500 text-sm">
            © 2024 XAU SMC Auto Trader. All rights reserved.
          </div>
          <div className="text-gray-500 text-sm mt-4 md:mt-0">
            Powered by <span className="text-amber-400">Emergent AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;