import React from "react";
import ReactDOM from "react-dom/client";
import "../core/i18n";
import App from "./App";
import "../index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");
const root = ReactDOM.createRoot(rootEl);
root.render(<App />);
