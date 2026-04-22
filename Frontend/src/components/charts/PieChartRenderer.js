/**
Pie Chart Renderer component.

Responsibilities:
- Render pie chart visualization using Recharts
- Format values displayed inside tooltips
- Apply dynamic color palette from chart configuration

This component receives chart metadata and dataset
from the ChartFactory and renders the pie chart.
*/


// ---------- IMPORTS ----------
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";


// ---------- VALUE FORMATTER ----------
/**
Formats numeric values for tooltip display.

If the chart represents percentage based values
like discount, rate, or percent, the value is
converted into percentage format.
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


// ---------- DEFAULT COLOR PALETTE ----------
/**
Fallback colors used when chart style does not
provide a custom palette.
*/
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];


// ---------- PIE CHART RENDERER ----------
/**
Renders a pie chart using provided dataset.

Props:
- chart : chart configuration metadata
- data  : processed dataset used for visualization
*/
const PieChartRenderer = ({ chart, data }) => {

  // ---------- DATA VALIDATION ----------
  /**
  Ensures chart is rendered only when valid data exists.
  */
  if (!data || data.length === 0) return <p>No data available</p>;

  // ---------- COLOR PALETTE SELECTION ----------
  /**
  Uses custom palette from chart configuration
  or falls back to default colors.
  */
  const palette = chart?.style?.colors || COLORS;


  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>

        {/* ---------- PIE VISUALIZATION ---------- */}
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          outerRadius={90}
          label
        >

          {/* ---------- COLOR ASSIGNMENT ---------- */}
          {data.map((_, index) => (
            <Cell
              key={index}
              fill={palette[index % palette.length]}
            />
          ))}

        </Pie>

        {/* ---------- TOOLTIP DISPLAY ---------- */}
        <Tooltip formatter={(v) => formatValue(v, chart)} />

      </PieChart>
    </ResponsiveContainer>
  );
};


// ---------- EXPORT ----------
export default PieChartRenderer;