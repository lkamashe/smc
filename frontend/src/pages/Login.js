import React from "react";
import { Button } from "../components/ui/button";

const Login = () => {
  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0b] via-[#1a1520] to-[#0f1419] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-block p-4 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-2xl backdrop-blur-sm border border-amber-500/30">
            <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            XAU SMC
          </h1>
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Auto Trader
          </h2>
          <p className="text-gray-400 text-lg max-w-sm mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Professional Smart Money Concepts analysis for XAUUSD. One signal, one opportunity, every day.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Button
            data-testid="google-login-button"
            onClick={handleLogin}
            className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-300 hover:shadow-amber-500/50 hover:scale-105"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="h-px w-16 bg-gray-700"></div>
            <span>Secure authentication via Emergent</span>
            <div className="h-px w-16 bg-gray-700"></div>
          </div>
        </div>

        <div className="pt-8 space-y-3 text-sm text-gray-400">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>H4 Bias Analysis</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>M15 Execution</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>Order Block Detection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;