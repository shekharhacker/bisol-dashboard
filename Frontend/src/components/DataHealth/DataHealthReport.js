import React from "react";

const getStatusClass = (status) => {
  if (status === "Good") return "status-good";
  if (status === "Moderate") return "status-moderate";
  if (status === "Critical") return "status-critical";
  return "";
};

const DataHealthReport = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="dh-overlay">
      <div className="dh-panel">

        {/* Header */}
        <div className="dh-header">
          <h2>Data Health Report</h2>
          <button className="dh-close-btn" onClick={onClose}>X</button>
        </div>

        {/* Summary Cards */}
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

        {/* Table */}
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

export default DataHealthReport;