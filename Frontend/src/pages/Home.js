/**
Home Page component.

Responsibilities:
- Provide the main entry interface after login
- Allow users to upload dataset files (CSV / Excel)
- Accept natural language prompt for dashboard generation
- Send requests to backend for file upload and dashboard generation
- Manage user session and logout functionality

This component acts as the starting point for
creating AI-generated dashboards in BiSol.
*/


// ---------- IMPORTS ----------
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import logo from "../assests/Logo.png";
const API_URL = process.env.REACT_APP_API_URL;


// ---------- COMPONENT ----------
/**
Main user interface for dataset upload
and dashboard generation.
*/
export default function Home() {

  const navigate = useNavigate();


  // ---------- STATE MANAGEMENT ----------
  /**
  Stores prompt input, loading state,
  and upload success flag.
  */
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);


  // ---------- USER SESSION ----------
  /**
  Retrieves stored user information
  and authentication token from local storage.
  */
  const userName = localStorage.getItem("bisol_user_name") || "User";
  const token = localStorage.getItem("bisol_token");


  // ---------- LOGOUT ----------
  /**
  Clears authentication token and
  redirects user to login page.
  */
  const handleLogout = () => {
    localStorage.removeItem("bisol_token");
    window.location.href = "/login";
  };


  // ---------- FILE UPLOAD ----------
  /**
  Handles dataset upload to backend.

  Flow:
  1. Select CSV or Excel file
  2. Send file to backend upload API
  3. Update upload success state
  */
  const handleFileUpload = async (e) => {

    const selected = e.target.files[0];
    if (!selected) return;

    const formData = new FormData();
    formData.append("file", selected);

    try {

      const res = await fetch("${API_URL}/upload-file", {
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

      // ---------- SUCCESS STATE ----------
      setUploadSuccess(true);

    } catch (err) {

      console.error(err);
      alert("File upload failed (network error)");
      setUploadSuccess(false);
    }
  };


  // ---------- DASHBOARD GENERATION ----------
  /**
  Sends user prompt to backend to generate dashboard.

  Requirements:
  - File must be uploaded successfully
  - Prompt must not be empty
  */
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
    formData.append("prompt", prompt);

    try {

      const res = await fetch("${API_URL}/generate-dashboard", {
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

      // ---------- NAVIGATION ----------
      navigate("/dashboard");

    } catch (err) {

      console.error(err);
      alert("Dashboard generation failed (network error)");

    } finally {

      setLoading(false);
    }
  };


  // ---------- UI RENDER ----------
  return (
    <div className="home">

      {/* ---------- HEADER ---------- */}
      <header className="home-header">
        <div className="brand">
          <img src={logo} alt="BiSol" />
          <span>BiSol</span>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>


      {/* ---------- MAIN CONTENT ---------- */}
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