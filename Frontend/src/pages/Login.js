import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import logo from "../assests/Logo.png";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ---- Validators ----
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com$/.test(email);

  // ---- LOGIN HANDLER ----
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
      const res = await fetch("http://127.0.0.1:8000/auth/login", {
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

      // ---- STORE AUTH SESSION ----
      localStorage.setItem("bisol_token", data.access_token);
      localStorage.setItem("bisol_user_name", data.name);
      localStorage.setItem("bisol_user_email", email);

      // Optional: keep frontend user state
      if (setUser) {
        setUser({ email });
      }

      window.location.href = "/home";
    } catch (error) {
      alert("Login failed. Backend not reachable.");
    } finally {
      setLoading(false);
    }
  };

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
