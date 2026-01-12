import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import logo from "../assests/Logo.png";

export default function Home() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const userName = localStorage.getItem("bisol_user_name");
  const token = localStorage.getItem("bisol_token");


  // 🚪 LOGOUT (NO SPLASH, NO LOADING)
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
      await fetch("http://127.0.0.1:8000/upload-file", {
        method: "POST",
        body: formData,
      });
      setFile(selected);
    } catch {
      alert("File upload failed");
    }
  };

  // 📊 GENERATE DASHBOARD
  const generateDashboard = async () => {
    if (!file || !prompt.trim()) {
      alert("Please upload a file and enter a prompt");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("user_email", userEmail);
    formData.append("prompt", prompt);
    formData.append("file_name", file.name);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/generate-dashboard",
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      window.latestDashboardResponse = {
        dashboard_spec: data.dashboard_spec,
        preview_rows: data.preview_rows,
      };

      navigate("/dashboard");
    } catch {
      alert("Dashboard generation failed");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ SAFE LOADING
  /*if (!token) {
    return <div className="loading-home">Loading...</div>;
  }*/

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
        <h1>Welcome to BiSol,{userName || "User"}</h1>

        <div className="card">
          <label>Upload CSV / Excel</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
          />

          <label>Dashboard Prompt</label>
          <textarea
            placeholder="Example: Create a dashboard with bar chart for industry comparison and pie chart for market share"
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
