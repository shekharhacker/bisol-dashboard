import React, { useState, useEffect } from "react";
import LoadingScreen from "./components/LoadingScreen";
import Home from "./pages/Home";

const App = () => {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return appReady ? <Home /> : <LoadingScreen />;
};

export default App;
