import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AccountCreation.css";
import logo from "../assests/Logo.png";

export default function AccountCreation({ setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  // ---- Validators ----
  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com$/.test(email);

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

  // ---- CREATE ACCOUNT ----
  const handleCreateAccount = (e) => {
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

    // ---- GET EXISTING USERS ----
    const storedUsers = JSON.parse(localStorage.getItem("bisolUsers")) || [];

    // ---- CHECK DUPLICATE EMAIL ----
    const alreadyExists = storedUsers.some(
      (user) => user.email === email
    );

    if (alreadyExists) {
      alert("Account already exists. Please login.");
      navigate("/login");
      return;
    }

    // ---- SAVE USER ----
    const newUser = { name, email, password };

    const updatedUsers = [...storedUsers, newUser];
    localStorage.setItem("bisolUsers", JSON.stringify(updatedUsers));

    // ---- AUTO LOGIN ----
    localStorage.setItem("bisolUser", JSON.stringify(newUser));
    setUser(newUser);
    navigate("/home");
  };

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

        <button type="submit">Create Account</button>

        <p className="hint">
          Password must contain uppercase, lowercase, number & special character
        </p>

        <p
          className="login-link"
          onClick={() => navigate("/login")}
        >
          Already have an account? Login
        </p>
      </form>
    </div>
  );
}
