import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Settings from "./pages/Settings";
import StealthMode from "./components/StealthMode";

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <StealthMode onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"        element={<Home />}     />
          <Route path="/analyze" element={<Analyze />}  />
          <Route path="/settings"element={<Settings />} />
          {/* Catch-all → home */}
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
