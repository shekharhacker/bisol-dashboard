/**
Chart Factory component.

Responsibilities:
- Dynamically select chart renderer
- Route chart configuration to correct component
- Keep dashboard logic clean and modular

This component receives chart metadata from the backend
and renders the appropriate visualization component.
*/


// ---------- IMPORTS ----------
import BarChartRenderer from "./BarChartRenderer";
import LineChartRenderer from "./LineChartRenderer";
import PieChartRenderer from "./PieChartRenderer";


// ---------- CHART FACTORY COMPONENT ----------
/**
Renders the correct chart renderer based on chart type.

Props:
- chart : chart configuration object from backend
- data  : dataset used for visualization

Supported chart types:
- bar
- line
- pie
*/
const ChartFactory = ({ chart, data }) => {


  // ---------- CHART TYPE SELECTION ----------
  /**
  Determines which chart renderer to use
  based on the type specified in chart metadata.
  */
  switch (chart.type) {

    case "bar":
      return <BarChartRenderer chart={chart} data={data} />;

    case "line":
      return <LineChartRenderer chart={chart} data={data} />;

    case "pie":
      return <PieChartRenderer chart={chart} data={data} />;

    // ---------- FALLBACK ----------
    /**
    Handles unsupported chart types gracefully.
    */
    default:
      return <p>Unsupported chart type</p>;
  }
};


// ---------- EXPORT ----------
/**
Exports ChartFactory so it can be used
inside dashboard or chart container components.
*/
export default ChartFactory;
