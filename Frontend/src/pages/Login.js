/**
Login component.

Responsibilities:
- Authenticate users with backend authentication API
- Perform basic email validation
- Store authentication token in local storage
- Redirect authenticated users to dashboard/home page

This component manages the login flow and
establishes the user session for the application.
*/


// ---------- IMPORTS ----------
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import logo from "../assests/Logo.png";
const API_URL = process.env.REACT_APP_API_URL;

// ---------- LOGIN COMPONENT ----------
/**
Handles user login and authentication process.

Props:
- setUser : optional state updater for storing
            authenticated user information in frontend
*/
export default function Login({ setUser }) {

  // ---------- STATE MANAGEMENT ----------
  /**
  Stores user credentials and loading state.
  */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  // ---------- EMAIL VALIDATOR ----------
  /**
  Validates supported email providers.

  Allowed providers:
  - gmail
  - yahoo
  - outlook
  - hotmail
  */
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com$/.test(email);


  // ---------- LOGIN HANDLER ----------
  /**
  Handles login form submission.

  Flow:
  1. Validate email format
  2. Ensure password is provided
  3. Send authentication request to backend
  4. Store authentication token in local storage
  5. Redirect user to dashboard/home page
  */
  const handleLogin = async (e) => {

    e.preventDefault();

    if (!validateEmail(email)) {
      alert("Enter a valid email (gmail, yahoo, outlook, hotmail)");
      return;
    }

    if (!password) {
      alert("Password is required");
      return;
    }

    setLoading(true);

    try {

      // ---------- AUTHENTICATION API REQUEST ----------
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        alert("Invalid email or password");
        setLoading(false);
        return;
      }

      const data = await res.json();


      // ---------- STORE AUTH SESSION ----------
      /**
      Saves authentication token and user details
      in browser local storage.
      */
      localStorage.setItem("bisol_token", data.access_token);
      localStorage.setItem("bisol_user_name", data.user.name);
      localStorage.setItem("bisol_user_email", data.user.email);


      // ---------- OPTIONAL USER STATE ----------
      if (setUser) {
        setUser({ email });
      }


      // ---------- REDIRECT ----------
      window.location.href = "/home";

    } catch (error) {

      // ---------- ERROR HANDLING ----------
      alert("Login failed. Backend not reachable.");

    } finally {

      setLoading(false);

    }
  };


  // ---------- UI RENDER ----------
  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>

        <img src={logo} alt="BiSol Logo" className="login-logo" />

        <h2>Login to BiSol</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* ---------- PASSWORD RESET ---------- */}
        <div className="forgot-password">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        {/* ---------- ACCOUNT CREATION ---------- */}
        <p className="note">
          Don’t have an account?{" "}
          <span
            style={{ color: "#1e6fe3", cursor: "pointer" }}
            onClick={() => navigate("/create-account")}
          >
            Create one
          </span>
        </p>

      </form>
    </div>
  );
}