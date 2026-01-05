import React from "react";
import "../styles/Splash.css";
import logo from "../assests/Logo.png";

export default function Splash() {
  return (
    <div className="splash-container">
      <img src={logo} alt="BiSol Logo" className="splash-logo" />
      <h1 className="splash-title">Welcome to BiSol</h1>
      <p className="splash-subtitle">
        AI-powered dashboard generation
      </p>
    </div>
  );
}
