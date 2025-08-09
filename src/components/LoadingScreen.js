import React from "react";
import "./LoadingScreen.css"; // Import the CSS file
import logo from "../Logo.png"; // Replace with your logo path

function LoadingScreen() {
  return (
    <div className="loading-container">
      <img src={logo} alt="App Logo" className="logo" />
      <p className="loading-text">Loading, please wait...</p>
    </div>
  );
}

export default LoadingScreen;
