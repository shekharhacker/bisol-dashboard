/**
Application Root component.

Responsibilities:
- Define application routing structure
- Control splash screen display on first load
- Manage route access based on authentication state
- Protect private routes such as Home and Dashboard

This component acts as the central routing
controller for the BiSol frontend application.
*/


// ---------- IMPORTS ----------
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import AccountCreation from "./pages/AccountCreation";
import Home from "./pages/Home";
import DashboardProvidingPage from "./pages/DashboardProvidingPage";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordSent from "./pages/ForgotPasswordSent";
import ResetPassword from "./pages/ResetPassword";


// ---------- APP COMPONENT ----------
/**
Main application component responsible for:
- Splash screen display
- Authentication-based routing
- Navigation between pages
*/
function App() {

  // ---------- SPLASH SCREEN STATE ----------
  /**
  Controls whether splash screen is displayed
  during initial application load.
  */
  const [showSplash, setShowSplash] = useState(true);


  // ---------- SPLASH TIMER ----------
  /**
  Shows splash screen briefly when application loads.
  */
  useEffect(() => {

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);

  }, []);


  // ---------- SPLASH DISPLAY ----------
  if (showSplash) return <Splash />;


  // ---------- AUTHENTICATION CHECK ----------
  /**
  Determines whether user is authenticated
  based on stored token.
  */
  const isLoggedIn = Boolean(localStorage.getItem("bisol_token"));


  // ---------- ROUTING ----------
  /**
  Defines all application routes and protects
  private pages using authentication checks.
  */
  return (
    <Router>
      <Routes>

        {/* ---------- LOGIN ---------- */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/home" replace /> : <Login />}
        />

        {/* ---------- CREATE ACCOUNT ---------- */}
        <Route
          path="/create-account"
          element={
            isLoggedIn ? <Navigate to="/home" replace /> : <AccountCreation />
          }
        />

        {/* ---------- HOME ---------- */}
        <Route
          path="/home"
          element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />}
        />

        {/* ---------- DASHBOARD ---------- */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn
              ? <DashboardProvidingPage />
              : <Navigate to="/login" replace />
          }
        />

        {/* ---------- ROOT ---------- */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ---------- FORGOT PASSWORD ---------- */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/sent" element={<ForgotPasswordSent />} />

        {/* ---------- RESET PASSWORD ---------- */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ---------- FALLBACK ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}


// ---------- EXPORT ----------
export default App;