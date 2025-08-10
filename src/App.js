import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";
import Home from "./pages/Home";
import AccountCreation from "./pages/AccountCreation";
import DashboardProvidingPage from "./pages/DashboardProvidingPage";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Small delay to show loading screen
    setTimeout(() => {
      const storedUser = localStorage.getItem("bisolUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={user ? <Home user={user} setUser={setUser} /> : <Navigate to="/account" replace />}
        />
        <Route path="/account" element={<AccountCreation setUser={setUser} />} />
        <Route path="/dashboard" element={<DashboardProvidingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
