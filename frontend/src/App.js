import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import HeroSection from "./components/HeroSection";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      {!showDashboard ? (
        <HeroSection onEnter={() => setShowDashboard(true)} />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;