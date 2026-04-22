/**
Line Chart Renderer component.

Responsibilities:
- Render line chart visualization using Recharts
- Format numeric values for axis and tooltip display
- Apply dynamic styling from chart configuration

This component receives chart metadata and dataset
from the ChartFactory and renders a line chart.
*/


// ---------- IMPORTS ----------
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


// ---------- VALUE FORMATTER ----------
/**
Formats numeric values for display.

If the chart represents percentage-based metrics
such as discount, rate, or percent, the value is
converted to percentage format.
*/
const formatValue = (value, chart) => {
  if (!chart?.y) return value;

  const y = chart.y.toLowerCase();

  if (
    y.includes("discount") ||
    y.includes("rate") ||
    y.includes("percent")
  ) {
    return (value * 100).toFixed(2) + "%";
  }

  return value;
};


// ---------- LINE CHART RENDERER ----------
/**
Renders a line chart using the provided dataset.

Props:
- chart : chart configuration metadata
- data  : processed dataset used for visualization
*/
const LineChartRenderer = ({ chart, data }) => {

  // ---------- DATA VALIDATION ----------
  /**
  Prevents rendering when dataset is empty.
  */
  if (!data || data.length === 0) return <p>No data available</p>;

  return (
    <ResponsiveContainer width="100%" height="100%">

      <LineChart data={data}>

        {/* ---------- GRID ---------- */}
        <CartesianGrid strokeDasharray="3 3" />

        {/* ---------- AXES ---------- */}
        <XAxis dataKey="label" />
        <YAxis tickFormatter={(v) => formatValue(v, chart)} />

        {/* ---------- TOOLTIP ---------- */}
        <Tooltip formatter={(v) => formatValue(v, chart)} />

        {/* ---------- LINE VISUALIZATION ---------- */}
        <Line
          dataKey="value"
          stroke={chart?.style?.color || "#2563eb"}
          strokeWidth={2}
        />

      </LineChart>

    </ResponsiveContainer>
  );
};


// ---------- EXPORT ----------
export default LineChartRenderer;