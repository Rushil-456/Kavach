import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import Settings from "./pages/Settings";

export default function App() {
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
