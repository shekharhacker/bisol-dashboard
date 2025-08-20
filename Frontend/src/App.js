import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";
import Home from "./pages/Home";
import AccountCreation from "./pages/AccountCreation";
import DashboardProvidingPage from "./pages/DashboardProvidingPage";

function App() {
  // State to track if the app is still loading (e.g., checking local storage)
  const [loading, setLoading] = useState(true);

  // State to hold the current logged-in user information
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Set a timer to simulate loading delay (e.g., fetching user session)
    const timer = setTimeout(() => {
      // Try to get 'bisolUser' from localStorage on app load
      const storedUser = localStorage.getItem("bisolUser");
      
      // If user data found, parse and set in state
      if (storedUser) setUser(JSON.parse(storedUser));

      // Loading finished, allow rendering routes
      setLoading(false);
    }, 1500);

    // Cleanup the timer if the component unmounts before timeout
    return () => clearTimeout(timer);
  }, []);

  // While loading, show the loading screen component
  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <Routes>
        {/* Root path "/" */}
        {/* If user is logged in, show Home; else redirect to account creation */}
        <Route
          path="/"
          element={
            user ? (
              <Home user={user} setUser={setUser} />
            ) : (
              <Navigate to="/account" replace />
            )
          }
        />

        {/* Account creation page route */}
        <Route path="/account" element={<AccountCreation setUser={setUser} />} />

        {/* Dashboard page route */}
        <Route path="/dashboard" element={<DashboardProvidingPage />} />

        {/* Catch-all route: redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
