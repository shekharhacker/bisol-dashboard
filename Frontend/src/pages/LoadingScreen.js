/**
Loading Screen component.

Responsibilities:
- Display loading indicator while application data is being fetched
- Show BiSol branding during loading phase
- Provide simple visual feedback to users during wait time

This component is used whenever the application
needs to show a temporary loading state.
*/


// ---------- IMPORTS ----------
import React from "react";
import "../styles/LoadingScreen.css";       // Component styles
import logo from "../assests/Logo.png";     // Application logo


// ---------- COMPONENT ----------
/**
Renders a simple loading interface with logo
and loading message.
*/
function LoadingScreen() {

  // ---------- UI RENDER ----------
  return (
    <div className="loading-container">
      <img src={logo} alt="BiSol Logo" className="logo" />
      <p className="loading-text">Loading, please wait...</p>
    </div>
  );
}


// ---------- EXPORT ----------
export default LoadingScreen;