import React, { useEffect, useState } from "react";
import "../styles/DashboardProvidingPage.css";
import logo from "../assests/Logo.png";

const DashboardProvidingPage = () => {
  const [dashboardSpec, setDashboardSpec] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenPrompt, setRegenPrompt] = useState("");

  useEffect(() => {
    // Read data passed from Home.js
    const stored = window.latestDashboardResponse;

    if (!stored || !stored.dashboard_spec) {
      setLoading(false);
      return;
    }

    setDashboardSpec(stored.dashboard_spec);
    setPreviewRows(stored.preview_rows || []);
    setLoading(false);
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
    return <div className="dashboard-loading">Generating dashboard...</div>;
  }

  if (!dashboardSpec) {
    return <div className="dashboard-error">No dashboard data available.</div>;
  }

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <img src={logo} alt="BiSol" />
        <h1>{dashboardSpec.dashboard_title || "Dashboard Preview"}</h1>
      </header>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* CHARTS */}
        <div className="dashboard-content">
          {dashboardSpec.charts?.map((chart, idx) => {
            const data = generateChartData(chart);

            return (
              <div className="chart-card" key={idx}>
                <h3>{chart.title}</h3>
                <pre>{JSON.stringify(data, null, 2)}</pre>
                {/* Later this becomes real charts */}
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
