import React from "react";
import "../styles/LoadingScreen.css";                // Component styles
import logo from "../assests/Logo.png";      // Import logo from assets folder

function LoadingScreen() {
  return (
    <div className="loading-container">
      <img src={logo} alt="BiSol Logo" className="logo" />
      <p className="loading-text">Loading, please wait...</p>
    </div>
  );
}

export default LoadingScreen;
