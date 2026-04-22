/**
Splash Screen component.

Responsibilities:
- Display application branding during initial load
- Show BiSol logo and welcome message
- Provide a simple introduction screen before
  the user navigates to authentication or dashboard

This component acts as the landing splash screen
for the BiSol application.
*/


// ---------- IMPORTS ----------
import React from "react";
import "../styles/Splash.css";
import logo from "../assests/Logo.png";


// ---------- COMPONENT ----------
/**
Renders the splash screen UI with
application branding and welcome message.
*/
export default function Splash() {

  // ---------- UI RENDER ----------
  return (
    <div className="splash-container">
      <img src={logo} alt="BiSol Logo" className="splash-logo" />

      <h1 className="splash-title">
        Welcome to BiSol
      </h1>

      <p className="splash-subtitle">
        AI-powered dashboard generation
      </p>
    </div>
  );
}