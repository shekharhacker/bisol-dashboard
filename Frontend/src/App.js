import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import AccountCreation from "./pages/AccountCreation";
import Home from "./pages/Home";
import DashboardProvidingPage from "./pages/DashboardProvidingPage";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // ---- SHOW SPLASH ONLY ON FIRST LOAD ----
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <Splash />;

  // 🔐 BACKEND AUTH CHECK
  const isLoggedIn = !!localStorage.getItem("bisol_token");

  return (
    <Router>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={
            isLoggedIn ? <Navigate to="/home" replace /> : <Login />
          }
        />

        {/* CREATE ACCOUNT */}
        <Route
          path="/create-account"
          element={
            isLoggedIn ? <Navigate to="/home" replace /> : <AccountCreation />
          }
        />

        {/* HOME */}
        <Route
          path="/home"
          element={
            isLoggedIn ? <Home /> : <Navigate to="/login" replace />
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <DashboardProvidingPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ROOT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
