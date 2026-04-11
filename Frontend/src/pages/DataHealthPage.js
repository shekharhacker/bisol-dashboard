import React from "react";
import "../styles/DataHealthPage.css";
import DataHealthReport from "../components/DataHealth/DataHealthReport";

const DataHealthPage = () => {

  // TEMP dummy data (we replace later with backend)
  const data = {
    summary: {
      rows: 100,
      columns: 5,
      missing: 20,
      completeness: 96
    },
    columns: [
      { column: "Name", missing: 0, percent: 0, status: "Good" },
      { column: "Email", missing: 5, percent: 5, status: "Moderate" },
      { column: "Phone", missing: 15, percent: 15, status: "Critical" }
    ]
  };

  return (
    <DataHealthReport
      data={data}
      onClose={() => window.history.back()}
    />
  );
};

export default DataHealthPage;