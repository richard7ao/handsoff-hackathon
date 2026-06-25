import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Dashboard } from "./Dashboard";
import { Schedule } from "./Schedule";
import { Marketplace } from "./Marketplace";
import { Chat } from "./Chat";
import "./index.css";

// Simple path-based page switch (SPA). Sub-pages fall back to index.html on Vercel.
const path = window.location.pathname.replace(/\/+$/, "");
const page = path.endsWith("/chat") ? (
  <Chat />
) : path.endsWith("/dashboard") ? (
  <Dashboard />
) : path.endsWith("/schedule") ? (
  <Schedule />
) : path.endsWith("/marketplace") ? (
  <Marketplace />
) : (
  <App />
);

createRoot(document.getElementById("root")!).render(<StrictMode>{page}</StrictMode>);
