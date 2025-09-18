import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// import TestApp from "./TestApp";
import ErrorBoundary from "./ErrorBoundary";

console.log("React app initializing...");

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("Root element found, creating React root...");
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log("React app mounted successfully");
} else {
  console.error("Root element not found!");
}
