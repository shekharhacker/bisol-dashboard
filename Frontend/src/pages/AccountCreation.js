/**
Account Creation component.

Responsibilities:
- Provide user interface for new account registration
- Perform basic frontend validations for email and password
- Send registration request to backend authentication API
- Redirect user to login page after successful registration

This component ensures a smooth account creation
experience with basic client-side validation.
*/


// ---------- IMPORTS ----------
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AccountCreation.css";
import logo from "../assests/Logo.png";
const API_URL = process.env.REACT_APP_API_URL;


// ---------- ACCOUNT CREATION COMPONENT ----------
/**
Handles user registration flow.

Features:
- Input validation (name, email, password)
- Backend API call for account creation
- Loading state handling
- Redirect to login page after success
*/
export default function AccountCreation() {

  // ---------- STATE MANAGEMENT ----------
  /**
  Stores user input values and loading state.
  */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  // ---------- VALIDATORS (UX ONLY) ----------
  /**
  Validates supported email providers.
  */
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com$/.test(email);

  /**
  Validates password strength.

  Requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - One number
  - One special character
  */
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);


  // ---------- CREATE ACCOUNT HANDLER ----------
  /**
  Handles form submission and account creation.

  Flow:
  1. Validate user inputs
  2. Send registration request to backend
  3. Handle success or error responses
  4. Redirect user to login page on success
  */
  const handleCreateAccount = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    if (!validateEmail(email)) {
      alert("Use a valid email (gmail, yahoo, outlook, hotmail)");
      return;
    }

    if (!validatePassword(password)) {
      alert(
        "Password must be at least 8 characters and include uppercase, lowercase, number & special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {

      // ---------- BACKEND API REQUEST ----------
      /**
      Sends registration request to backend authentication service.
      */
      const res = await fetch("${API_URL}/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Registration failed");
        return;
      }

      alert("Account created successfully. Please login.");
      navigate("/login");

    } catch (err) {

      // ---------- ERROR HANDLING ----------
      alert("Server error. Try again later.");

    } finally {

      // ---------- LOADING STATE RESET ----------
      setLoading(false);
    }
  };


  // ---------- UI RENDER ----------
  return (
    <div className="account-container">
      <form className="account-box" onSubmit={handleCreateAccount}>
        <img src={logo} alt="BiSol Logo" className="account-logo" />

        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email (gmail, yahoo, etc.)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="hint">
          Password must contain uppercase, lowercase, number & special character
        </p>

        <p className="login-link" onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </form>
    </div>
  );
}