// ChartFactory.js
import BarChartRenderer from "./BarChartRenderer";
import LineChartRenderer from "./LineChartRenderer";
import PieChartRenderer from "./PieChartRenderer";

const ChartFactory = ({ chart, data }) => {
  switch (chart.type) {
    case "bar":
      return <BarChartRenderer chart={chart} data={data} />;
    case "line":
      return <LineChartRenderer chart={chart} data={data} />;
    case "pie":
      return <PieChartRenderer chart={chart} data={data} />;
    default:
      return <p>Unsupported chart type</p>;
  }
};

export default ChartFactory;
