import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import logo from "../assests/Logo.png";

export default function Home() {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const userName = localStorage.getItem("bisol_user_name") || "User";
  const token = localStorage.getItem("bisol_token");

  // 🚪 LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("bisol_token");
    window.location.href = "/login";
  };

  // 📁 FILE UPLOAD
  const handleFileUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-file", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "File upload failed");
        setUploadSuccess(false);
        return;
      }

      // ✅ Upload successful
      setUploadSuccess(true);
    } catch (err) {
      console.error(err);
      alert("File upload failed (network error)");
      setUploadSuccess(false);
    }
  };

  // 📊 GENERATE DASHBOARD
  const generateDashboard = async () => {
    if (!uploadSuccess) {
      alert("Please upload a valid file before generating dashboard");
      return;
    }

    if (!prompt.trim()) {
      alert("Please enter a dashboard prompt");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("prompt", prompt); // ✅ ONLY prompt

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-dashboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Dashboard generation failed");
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Dashboard generation failed (network error)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <header className="home-header">
        <div className="brand">
          <img src={logo} alt="BiSol" />
          <span>BiSol</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="home-main">
        <h1>Welcome to BiSol, {userName}</h1>

        <div className="card">
          <label>Upload CSV / Excel</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
          />

          <label>Dashboard Prompt</label>
          <textarea
            placeholder="Example: Show sales distribution by region"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <button
            className="generate-btn"
            onClick={generateDashboard}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Dashboard"}
          </button>
        </div>
      </main>
    </div>
  );
}
