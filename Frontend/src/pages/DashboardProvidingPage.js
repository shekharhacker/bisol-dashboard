import React, { useEffect, useState } from "react";
import "../styles/DashboardProvidingPage.css";
import logo from "../assests/Logo.png";

const DashboardProvidingPage = () => {
  const [dashboardSpec, setDashboardSpec] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenPrompt, setRegenPrompt] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("bisol_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://127.0.0.1:8000/auth/generate-dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("bisol_token");
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        // Temporary secure dashboard structure
        setDashboardSpec({
          dashboard_title: "Secure BiSol Dashboard",
          charts: [],
        });

        setPreviewRows([]);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // ---------------- SAFE CHART DATA GENERATOR ----------------
  const generateChartData = (chart) => {
    if (!chart || !chart.column || previewRows.length === 0) return [];

    const counts = {};

    previewRows.forEach((row) => {
      const value = row[chart.column];
      if (!value) return;
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).map(([key, val]) => ({
      label: key,
      value: val,
    }));
  };

  // ---------------- UI STATES ----------------
  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (!dashboardSpec) {
    return <div className="dashboard-error">No dashboard data available.</div>;
  }

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <img src={logo} alt="BiSol" />
        <h1>{dashboardSpec.dashboard_title}</h1>
      </header>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* CHARTS */}
        <div className="dashboard-content">
          {dashboardSpec.charts.length === 0 && (
            <div className="chart-card">
              <p>No charts yet. Analytics coming next.</p>
            </div>
          )}

          {dashboardSpec.charts.map((chart, idx) => {
            const data = generateChartData(chart);

            return (
              <div className="chart-card" key={idx}>
                <h3>{chart.title}</h3>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            );
          })}
        </div>

        {/* DOWNLOAD PANEL */}
        <aside className="dashboard-actions">
          <h3>Download</h3>
          <button className="btn blue">As Image (PNG)</button>
          <button className="btn green">As PDF</button>
        </aside>
      </div>

      {/* REGENERATE */}
      <div className="dashboard-regenerate">
        <h3>Any changes required?</h3>
        <textarea
          value={regenPrompt}
          onChange={(e) => setRegenPrompt(e.target.value)}
          placeholder="Describe changes you want..."
        />
        <button className="btn primary">Regenerate Dashboard</button>
      </div>
    </div>
  );
};

export default DashboardProvidingPage;
