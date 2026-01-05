import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import logo from "../assests/Logo.png";

export default function Home() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- LOAD USER ONCE ----------------
  useEffect(() => {
    const storedUser = localStorage.getItem("bisolUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // ---------------- LOGOUT ----------------
  const logout = () => {
    localStorage.removeItem("bisolUser");
    navigate("/login", { replace: true });
  };

  // ---------------- FILE UPLOAD ----------------
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
    } catch (err) {
      alert("File upload failed");
    }
  };

  // ---------------- GENERATE DASHBOARD ----------------
  const generateDashboard = async () => {
    if (!file || !prompt.trim()) {
      alert("Please upload a file and enter a prompt");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("user_email", user.email);
    formData.append("prompt", prompt);
    formData.append("file_name", file.name);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/generate-dashboard",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      // ---- FALLBACK SAFE (even if OpenAI fails) ----
      window.latestDashboardResponse = {
        dashboard_spec: data.dashboard_spec || {
          dashboard_title: "Dashboard Preview",
          charts: data.charts || [],
        },
        preview_rows: data.sample || [],
      };

      navigate("/dashboard");
    } catch (err) {
      alert("Dashboard generation failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- GUARD ----------------
  if (!user) {
    return <div className="loading-home">Loading...</div>;
  }

  // ---------------- UI ----------------
  return (
    <div className="home">
      {/* HEADER */}
      <header className="home-header">
        <div className="brand">
          <img src={logo} alt="BiSol" />
          <span>BiSol</span>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      {/* MAIN */}
      <main className="home-main">
        <h1>Welcome, {user.name}</h1>

        <div className="card">
          <label>Upload CSV / Excel</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
          />

          <label>Dashboard Prompt</label>
          <textarea
            placeholder="Example: Create a dashboard with bar chart for industry comparison and a pie chart for market share"
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
