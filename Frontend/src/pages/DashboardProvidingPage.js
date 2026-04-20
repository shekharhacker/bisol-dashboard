import React, { useEffect, useState, useRef  } from "react";
import "../styles/DashboardProvidingPage.css";
import ChartFactory from "../components/charts/ChartFactory";
import logo from "../assests/Logo.png";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import DataHealthReport from "../components/DataHealth/DataHealthReport.js";

//--------------THEME STATES SETTINGS---------------
  const THEMES = {
    light: {
      canvas: {
        backgroundColor: "#ffffff",
      },
      chart: {
        bar: "#2563eb",
        line: "#2563eb",
        pie: ["#2563eb", "#22c55e", "#f59e0b", "#ef4444"],
      },
    },

    dark: {
      canvas: {
        backgroundColor: "#111827",
      },
      chart: {
        bar: "#38bdf8",
        line: "#38bdf8",
        pie: ["#38bdf8", "#22c55e", "#f59e0b", "#f87171"],
      },
    },

    corporate: {
      canvas: {
        backgroundColor: "#f8fafc",
      },
      chart: {
        bar: "#0f172a",
        line: "#0f172a",
        pie: ["#0f172a", "#64748b", "#94a3b8"],
      },
    },
  };


const DashboardProvidingPage = () => {
  // ---------------- REFS & STATE ----------------
  const dashboardRef = useRef(null);
  const [dataHealth, setDataHealth] = useState(null);
  const [showDataHealth, setShowDataHealth] = useState(false);
  const [canvasConfig, setCanvasConfig] = useState({
  width: "100%",
  height: "600px",
  backgroundColor: "#ffffff",
  });
  const [dashboardSpec, setDashboardSpec] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenPrompt, setRegenPrompt] = useState("");

  // ---------------- FETCH DASHBOARD DATA ----------------
  useEffect(() => {
    const token = localStorage.getItem("bisol_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://127.0.0.1:8000/dashboard-data", {
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
        if (!res.ok) {
          throw new Error("Failed to load dashboard");
        }
        return res.json();
      })
      .then((data) => {
        const spec = data.dashboard_spec;

        setDashboardSpec(spec);
        setPreviewRows(data.preview_rows);

        if (spec.canvas) {
          setCanvasConfig(spec.canvas);
        }

        setLoading(false);
      });
  }, []);

  //---------------- Dashboard Regeneration (FIXED) --------------
const handleRegenerate = async () => {
  const token = localStorage.getItem("bisol_token");

  if (!regenPrompt.trim()) {
    alert("Please enter a prompt");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("prompt", regenPrompt);

    const res = await fetch("http://127.0.0.1:8000/generate-dashboard", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to regenerate");

    const data = await res.json();

    console.log("NEW DATA:", data); // debug (keep for now)

    // 🔴 IMPORTANT FIXES
    setDashboardSpec(null); // clear old UI first

    setTimeout(() => {
      setDashboardSpec({ ...data.dashboard_spec }); // force new reference
      setPreviewRows(data.preview_rows);

      // update canvas too (you missed this earlier)
      if (data.dashboard_spec.canvas) {
        setCanvasConfig(data.dashboard_spec.canvas);
      }
    }, 50);

    setRegenPrompt(""); // clear input
    alert("Dashboard updated successfully");
  } catch (err) {
    console.error(err);
    alert("Regeneration failed");
  } finally {
    setLoading(false);
  }
};

  //----------------- DASHBOARD SPEC PERSISTS------------
  const updateDashboardSpec = (newCanvasConfig) => {
  setCanvasConfig(newCanvasConfig);

  setDashboardSpec((prevSpec) => {
    if (!prevSpec) return prevSpec;

    return {
      ...prevSpec,
      canvas: newCanvasConfig,
    };
  });
};

  // ---------------- DOWNLOAD FUNCTIONS ----------------
  const downloadPNG = async () => {
    if (!dashboardRef.current) {
      alert("Dashboard not ready");
      return;
    }

    try {
      const dataUrl = await htmlToImage.toPng(dashboardRef.current, {
        backgroundColor: canvasConfig.backgroundColor,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = "dashboard.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Failed to download image");
    }
  };

  const downloadPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(dashboardRef.current, {
        backgroundColor: canvasConfig.backgroundColor,
        pixelRatio: 2,
      });

      const pdf = new jsPDF("landscape", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(
        dataUrl,
        "PNG",
        20,
        20,
        pageWidth - 40,
        pageHeight - 40
      );

      pdf.save("dashboard.pdf");
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF");
    }
  };

  // ---------------- SAFE CHART DATA GENERATOR ----------------
  const generateChartData = (chart) => {
    if (!chart || !chart.x || previewRows.length === 0) return [];

    // COUNT-based charts
    if (chart.y === "__count__") {
      const counts = {};

      previewRows.forEach((row) => {
        const value = row[chart.x];
        if (value === null || value === undefined) return;
        counts[value] = (counts[value] || 0) + 1;
      });

      return Object.entries(counts).map(([key, val]) => ({
        label: key,
        value: val,
      }));
    }

    // Numeric charts (future-ready)
    return previewRows.map((row) => ({
      label: row[chart.x],
      value: row[chart.y],
    }));
  };

  //----------------- APPLYING THEME METHOD--------
    const applyTheme = (themeName) => {
    const theme = THEMES[themeName];

    // Update canvas
    setCanvasConfig((prev) => ({
      ...prev,
      backgroundColor: theme.canvas.backgroundColor,
    }));

    // Apply colors to charts
    setDashboardSpec((prev) => ({
      ...prev,
      charts: prev.charts.map((chart) => {
        if (chart.type === "bar") {
          return {
            ...chart,
            style: { color: theme.chart.bar },
          };
        }

        if (chart.type === "line") {
          return {
            ...chart,
            style: { color: theme.chart.line },
          };
        }

        if (chart.type === "pie") {
          return {
            ...chart,
            style: { colors: theme.chart.pie },
          };
        }

        return chart;
      }),
    }));
  };
  //----------------Data Health-----------------
  useEffect(() => {
  if (showDataHealth) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [showDataHealth]);

const generateDataHealth = () => {
  if (!previewRows || previewRows.length === 0) {
    return {
      summary: {
        rows: 0,
        columns: 0,
        missing: 0,
        completeness: 0,
      },
      columns: [],
    };
  }

  const totalRows = previewRows.length;
  const columns = Object.keys(previewRows[0] || {});

  let totalMissing = 0;

  const columnStats = columns.map((col) => {
    let missing = 0;

    previewRows.forEach((row) => {
      const value = row?.[col];
      if (value === null || value === undefined || value === "") {
        missing++;
      }
    });

    const percent = totalRows
      ? ((missing / totalRows) * 100).toFixed(1)
      : 0;

    totalMissing += missing;

    let status = "Good";
    if (percent > 20) status = "Critical";
    else if (percent > 5) status = "Moderate";

    return {
      column: col,
      missing,
      percent,
      status,
    };
  });

  const completeness =
    totalRows && columns.length
      ? (
          100 -
          (totalMissing / (totalRows * columns.length)) * 100
        ).toFixed(1)
      : 0;

  return {
    summary: {
      rows: totalRows,
      columns: columns.length,
      missing: totalMissing,
      completeness,
    },
    columns: columnStats,
  };
};


  // ---------------- UI STATES ----------------
  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (!dashboardSpec) {
    return <div className="dashboard-error">No dashboard data available.</div>;
  }

  // ---------------- RENDER ----------------
  return (
  <div className="dashboard-container">
  {/* HEADER */}
  <header className="dashboard-header">
    <img src={logo} alt="BiSol" />
    <h1>{dashboardSpec.dashboard_title}</h1>
  </header>

  {/* MAIN GRID */}
  <div className="dashboard-grid">
    {/* DASHBOARD CANVAS (EXPORT TARGET) */}
    <div
      ref={dashboardRef}
      className="dashboard-canvas"
      style={{
        width: canvasConfig.width,
        height: canvasConfig.height,
        backgroundColor: canvasConfig.backgroundColor,
      }}
    >
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
              <ChartFactory chart={chart} data={data} />
            </div>
          );
        })}
      </div>
    </div>

    {/* SIDEBAR CONTROLS */}
    <aside className="dashboard-actions">
      {/* THEMES */}
      <h3>Themes</h3>
      <button className="btn" onClick={() => applyTheme("light")}>
        Light
      </button>
      <button className="btn" onClick={() => applyTheme("dark")}>
        Dark
      </button>
      <button className="btn" onClick={() => applyTheme("corporate")}>
        Corporate
      </button>

      <hr style={{ margin: "16px 0" }} />

      {/* 🔴 DATA HEALTH REPORT BUTTON (NEW) */}
      <h3>Insights</h3>
      <button
        className="btn"
        disabled={!previewRows.length}
        onClick={() => {
          const result = generateDataHealth();
          setDataHealth(result);
          setShowDataHealth(true);}}
      >
        Data Health Report
      </button>
      <hr style={{ margin: "16px 0" }} />


      {/* BACKGROUND */}
      <h3>Background</h3>
      <button
        className="btn"
        onClick={() =>
          updateDashboardSpec({
            ...canvasConfig,
            backgroundColor: "#ffffff",
          })
        }
      >
        White
      </button>
      <button
        className="btn"
        onClick={() =>
          updateDashboardSpec({
            ...canvasConfig,
            backgroundColor: "#f5f7fb",
          })
        }
      >
        Light Gray
      </button>
      <button
        className="btn"
        onClick={() =>
          updateDashboardSpec({
            ...canvasConfig,
            backgroundColor: "#111827",
          })
        }
      >
        Dark
      </button>

      <hr style={{ margin: "16px 0" }} />

      {/* CANVAS SIZE */}
      <h3>Canvas Size</h3>
      <button
        type="button"
        className="btn"
        onClick={() =>
          updateDashboardSpec({
            ...canvasConfig,
            width: "100%",
            height: "600px",
          })
        }
      >
        Presentation (16:9)
      </button>

      <button
        type="button"
        className="btn"
        onClick={() =>
          updateDashboardSpec({
            ...canvasConfig,
            width: "794px",
            height: "1123px",
          })
        }
      >
        Report (A4)
      </button>

      <button
        type="button"
        className="btn"
        onClick={() =>
          updateDashboardSpec({
            ...canvasConfig,
            width: "100%",
            height: "auto",
          })
        }
      >
        Full Width
      </button>

      <hr style={{ margin: "16px 0" }} />

      {/* DOWNLOAD */}
      <h3>Download</h3>
      <button className="btn blue" onClick={downloadPNG}>
        As Image (PNG)
      </button>
      <button className="btn green" onClick={downloadPDF}>
        As PDF
      </button>
    </aside>

    {showDataHealth && dataHealth && (
    <DataHealthReport
      data={dataHealth}
      onClose={() => setShowDataHealth(false)}
    />
    )}
  </div>

  {/* REGENERATE (ENHANCED) */}
<div className="dashboard-regenerate">
  <h3>Any changes required?</h3>

  {loading && (
  <div className="overlay-loading">
    Generating new insights...
  </div>
)}

  <textarea
    value={regenPrompt}
    onChange={(e) => setRegenPrompt(e.target.value)}
    placeholder="Describe changes you want..."
  />

  <button 
    className="btn primary" 
    onClick={handleRegenerate}
    disabled={loading}
  >
    {loading ? "Generating..." : "Regenerate Dashboard"}
  </button>
  </div>
  </div>
  );
};

export default DashboardProvidingPage;
