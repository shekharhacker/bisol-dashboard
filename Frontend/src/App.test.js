import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders BiSol application", () => {
  render(<App />);
  const appName = screen.getByText(/BiSol/i);
  expect(appName).toBeInTheDocument();
});
