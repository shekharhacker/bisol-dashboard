import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';          // Import global CSS including Tailwind
import App from './App';       // Main App component
import reportWebVitals from './reportWebVitals';  // For measuring app performance

// Create root for React 18 rendering (new API)
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App inside React.StrictMode for highlighting potential problems
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: start measuring performance metrics
// Pass a function to send results to console or analytics endpoint
reportWebVitals();
