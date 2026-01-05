import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import logo from "../assests/Logo.png";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ---- Validators ----
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com$/.test(email);

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

  // ---- LOGIN HANDLER ----
  const handleLogin = (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      alert("Enter a valid email (gmail, yahoo, outlook, hotmail)");
      return;
    }

    if (!validatePassword(password)) {
      alert(
        "Password must contain uppercase, lowercase, number, special character and be at least 8 characters long"
      );
      return;
    }

    // ---- GET STORED USERS ----
    const storedUsers = JSON.parse(localStorage.getItem("bisolUsers")) || [];

    const foundUser = storedUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      alert("Invalid credentials or account not found");
      return;
    }

    // ---- SUCCESS ----
    localStorage.setItem("bisolUser", JSON.stringify(foundUser));
    setUser(foundUser);
    navigate("/home");
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
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

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
