/**
Data Health Report component.

Responsibilities:
- Display dataset health summary in a modal panel
- Show row, column, missing value, and completeness metrics
- Present column-wise missing data analysis with status labels

This component is used to provide users with a quick
overview of dataset quality before generating charts.
*/


// ---------- IMPORTS ----------
import React from "react";
import "./DataHealthReport.css";


// ---------- STATUS CLASS HELPER ----------
/**
Maps health status values to CSS classes.

Used to apply different styles for column status
such as Good, Moderate, and Critical.
*/
const getStatusClass = (status) => {
  if (status === "Good") return "status-good";
  if (status === "Moderate") return "status-moderate";
  if (status === "Critical") return "status-critical";
  return "";
};


// ---------- DATA HEALTH REPORT COMPONENT ----------
/**
Renders a modal-style data health report.

Props:
- data    : dataset health report object
- onClose : function to close the report panel
*/
const DataHealthReport = ({ data, onClose }) => {

  // ---------- DATA VALIDATION ----------
  /**
  Handles cases where report data is not available
  or dataset columns are missing.
  */
  if (!data || !data.columns) {
    return (
      <div className="dh-overlay">
        <div className="dh-panel">
          <h2>No Data Available</h2>
          <p>Upload valid dataset to view data health.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dh-overlay">
      <div className="dh-panel">

        {/* ---------- HEADER ---------- */}
        <div className="dh-header">
          <h2>Data Health Report</h2>
          <button className="dh-close-btn" onClick={onClose}>X</button>
        </div>

        {/* ---------- SUMMARY CARDS ---------- */}
        <div className="dh-cards">
          <div className="dh-card">
            <p>Rows</p>
            <h3>{data.summary.rows}</h3>
          </div>
          <div className="dh-card">
            <p>Columns</p>
            <h3>{data.summary.columns}</h3>
          </div>
          <div className="dh-card">
            <p>Missing</p>
            <h3>{data.summary.missing}</h3>
          </div>
          <div className="dh-card">
            <p>Completeness</p>
            <h3>{data.summary.completeness}%</h3>
          </div>
        </div>

        {/* ---------- COLUMN ANALYSIS TABLE ---------- */}
        <div className="dh-table-container">
          <h3>Column Analysis</h3>
          <table className="dh-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Missing</th>
                <th>% Missing</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.columns.map((col, index) => (
                <tr key={index}>
                  <td>{col.column}</td>
                  <td>{col.missing}</td>
                  <td>{col.percent}%</td>
                  <td className={getStatusClass(col.status)}>
                    {col.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};


// ---------- EXPORT ----------
export default DataHealthReport;